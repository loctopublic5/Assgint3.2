const Url = require('../models/Url');
const { generateUniqueShortCode, isValidAlias } = require('../services/shortCodeGenerator');
const { validateUrl } = require('../services/urlValidator');

// ───────────────────────────────────────────────────────────
// POST /api/shorten — Rút gọn URL
// ───────────────────────────────────────────────────────────
/**
 * Tạo một short link mới.
 *
 * Body: {
 *   originalUrl: string (required),
 *   customAlias: string (optional, 4-20 chars, bonus feature)
 * }
 * Auth: Optional JWT (nếu có → gắn link với user)
 *
 * Response 201: { success, data: { shortUrl, shortCode, originalUrl, clicks, createdAt } }
 */
const shortenUrl = async (req, res, next) => {
  try {
    const { originalUrl, customAlias } = req.body;

    // 1. Validate URL gốc
    const validation = validateUrl(originalUrl);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.message,
      });
    }

    // 2. Xử lý short code (custom alias hoặc tự sinh)
    let shortCode;

    if (customAlias) {
      // Validate format của custom alias
      if (!isValidAlias(customAlias)) {
        return res.status(400).json({
          success: false,
          error: 'Custom alias chỉ được chứa chữ cái, số, dấu gạch ngang (-) và gạch dưới (_), độ dài 4-20 ký tự.',
        });
      }

      // Kiểm tra alias đã tồn tại chưa
      const existingAlias = await Url.findOne({ shortCode: customAlias });
      if (existingAlias) {
        return res.status(409).json({
          success: false,
          error: `Alias "${customAlias}" đã được sử dụng. Vui lòng chọn alias khác.`,
        });
      }

      shortCode = customAlias;
    } else {
      // Tự động sinh short code duy nhất
      shortCode = await generateUniqueShortCode();
    }

    // 3. Lưu vào DB (gắn userId nếu user đã đăng nhập)
    const newUrl = await Url.create({
      originalUrl,
      shortCode,
      userId: req.user ? req.user._id : null,
    });

    // 4. Trả về response
    res.status(201).json({
      success: true,
      data: {
        id: newUrl._id,
        originalUrl: newUrl.originalUrl,
        shortCode: newUrl.shortCode,
        shortUrl: newUrl.shortUrl, // Virtual field: BASE_URL/shortCode
        clicks: newUrl.clicks,
        createdAt: newUrl.createdAt,
        ...(req.user && { userId: req.user._id }),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ───────────────────────────────────────────────────────────
// GET /:shortCode — Redirect 301 đến URL gốc
// ───────────────────────────────────────────────────────────
/**
 * Tìm URL gốc theo shortCode và redirect.
 * Tăng biến clicks mỗi lần redirect thành công.
 *
 * Không cần Auth.
 * Response: 301 Redirect hoặc 404 JSON
 */
const redirectUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // Tìm và tăng clicks trong một atomic operation (findOneAndUpdate)
    // Tránh race condition khi nhiều người cùng click một lúc
    const url = await Url.findOneAndUpdate(
      { shortCode },
      { $inc: { clicks: 1 } },
      { new: true } // trả về document sau khi update
    );

    if (!url) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy link ngắn với mã "${shortCode}". Link có thể đã bị xóa hoặc không tồn tại.`,
      });
    }

    // Kiểm tra link có hết hạn không (nếu có expiresAt)
    if (url.expiresAt && new Date() > url.expiresAt) {
      return res.status(410).json({
        success: false,
        error: 'Link này đã hết hạn.',
      });
    }

    // Redirect 301 (Permanent) về URL gốc
    res.redirect(301, url.originalUrl);
  } catch (error) {
    next(error);
  }
};

// ───────────────────────────────────────────────────────────
// GET /api/urls/:shortCode/stats — Thống kê link
// ───────────────────────────────────────────────────────────
/**
 * Trả về thống kê chi tiết của một short link.
 * Không cần Auth.
 *
 * Response 200: { success, data: { shortCode, originalUrl, clicks, shortUrl, createdAt, ... } }
 */
const getStats = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    const url = await Url.findOne({ shortCode }).populate('userId', 'username');

    if (!url) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy thống kê cho mã "${shortCode}".`,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        shortUrl: url.shortUrl,
        clicks: url.clicks,
        createdAt: url.createdAt,
        updatedAt: url.updatedAt,
        createdBy: url.userId ? url.userId.username : 'Anonymous',
      },
    });
  } catch (error) {
    next(error);
  }
};

// ───────────────────────────────────────────────────────────
// GET /api/urls — Lấy danh sách link của user hiện tại
// ───────────────────────────────────────────────────────────
/**
 * Lấy tất cả link đã tạo bởi user đang đăng nhập.
 * Cần JWT (middleware 'protect').
 *
 * Query params:
 * - page (default 1)
 * - limit (default 10, max 50)
 * - sortBy (clicks|createdAt, default createdAt)
 * - order (asc|desc, default desc)
 *
 * Response 200: { success, total, page, limit, data: [...] }
 */
const getUserUrls = async (req, res, next) => {
  try {
    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Sorting
    const allowedSortFields = ['clicks', 'createdAt', 'updatedAt'];
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    const [urls, total] = await Promise.all([
      Url.find({ userId: req.user._id })
        .sort({ [sortBy]: order })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Url.countDocuments({ userId: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: urls,
    });
  } catch (error) {
    next(error);
  }
};

// ───────────────────────────────────────────────────────────
// DELETE /api/urls/:shortCode — Xóa link (chỉ owner)
// ───────────────────────────────────────────────────────────
/**
 * Xóa một short link.
 * Cần JWT và chỉ owner mới được xóa.
 *
 * Response 200: { success, message }
 */
const deleteUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // Tìm link trong DB
    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy link với mã "${shortCode}".`,
      });
    }

    // Kiểm tra quyền sở hữu (ownership check)
    // userId có thể null (anonymous) — null !== user._id nên không xóa được
    if (!url.userId || url.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền xóa link này. Chỉ người tạo link mới có thể xóa.',
      });
    }

    await url.deleteOne();

    res.status(200).json({
      success: true,
      message: `Đã xóa link ngắn "${shortCode}" thành công.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  shortenUrl,
  redirectUrl,
  getStats,
  getUserUrls,
  deleteUrl,
};

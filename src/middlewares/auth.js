const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Xác thực JWT bắt buộc.
 *
 * Dùng cho các route yêu cầu đăng nhập:
 * - GET /api/urls (danh sách link của user)
 * - DELETE /api/urls/:shortCode (xóa link)
 *
 * Token phải được gửi trong header: Authorization: Bearer <token>
 */
const protect = async (req, res, next) => {
  let token;

  // Lấy token từ Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Không có quyền truy cập. Vui lòng đăng nhập để tiếp tục.',
    });
  }

  try {
    // Verify và decode JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user trong DB để đảm bảo user vẫn tồn tại
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User không còn tồn tại. Vui lòng đăng nhập lại.',
      });
    }

    // Gắn user vào request để các controller sau dùng
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Token không hợp lệ.',
    });
  }
};

/**
 * Middleware: Xác thực JWT tùy chọn (Optional Auth).
 *
 * Dùng cho các route cho phép cả user ẩn danh lẫn đã đăng nhập:
 * - POST /api/shorten (user đăng nhập có thể gắn link vào tài khoản)
 * - GET /api/urls/:shortCode/stats
 *
 * Không trả lỗi nếu không có token — chỉ gắn req.user nếu token hợp lệ.
 */
const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null; // Không có token → anonymous user
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    req.user = user || null;
  } catch {
    req.user = null; // Token lỗi → coi như anonymous
  }

  next();
};

module.exports = { protect, optionalProtect };

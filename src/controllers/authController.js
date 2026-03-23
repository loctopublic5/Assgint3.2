const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Hàm helper: Tạo JWT token cho user
 * @param {string} userId - MongoDB _id của user
 * @returns {string} JWT token
 */
const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Helper: Format user data trả về (loại bỏ thông tin nhạy cảm)
 */
const formatUserResponse = (user, token) => ({
  success: true,
  token,
  user: {
    id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  },
});

// ───────────────────────────────────────────────────────────
// POST /api/auth/register
// ───────────────────────────────────────────────────────────
/**
 * Đăng ký tài khoản mới.
 *
 * Body: { username, email, password }
 * Response 201: { success, token, user }
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validate input cơ bản
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đầy đủ username, email và password',
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.',
      });
    }

    // Kiểm tra username đã tồn tại chưa
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        error: 'Username này đã được sử dụng. Vui lòng chọn username khác.',
      });
    }

    // Tạo user mới (password sẽ được hash tự động trong pre-save hook)
    const user = await User.create({ username, email, password });

    // Tạo JWT và trả về
    const token = signToken(user._id);
    res.status(201).json(formatUserResponse(user, token));
  } catch (error) {
    next(error); // Chuyển lỗi sang Global Error Handler
  }
};

// ───────────────────────────────────────────────────────────
// POST /api/auth/login
// ───────────────────────────────────────────────────────────
/**
 * Đăng nhập và nhận JWT token.
 *
 * Body: { email, password }
 * Response 200: { success, token, user }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp email và password',
      });
    }

    // Lấy user kèm password (mặc định select: false nên phải dùng .select('+password'))
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      // Trả thông báo chung (không tiết lộ email có tồn tại hay không)
      return res.status(401).json({
        success: false,
        error: 'Email hoặc password không đúng',
      });
    }

    // So sánh password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        error: 'Email hoặc password không đúng',
      });
    }

    const token = signToken(user._id);
    res.status(200).json(formatUserResponse(user, token));
  } catch (error) {
    next(error);
  }
};

// ───────────────────────────────────────────────────────────
// GET /api/auth/me — Lấy thông tin user hiện tại
// ───────────────────────────────────────────────────────────
/**
 * Trả về thông tin profile của user đang đăng nhập.
 * Cần JWT (sử dụng middleware 'protect').
 */
const getMe = async (req, res) => {
  // req.user đã được gắn bởi middleware 'protect'
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      createdAt: req.user.createdAt,
    },
  });
};

module.exports = { register, login, getMe };

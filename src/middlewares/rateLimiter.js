const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter cho endpoint POST /api/shorten
 *
 * Giới hạn: 100 request / IP / phút
 * Khi vượt quá → trả về 429 Too Many Requests với JSON message
 */
const shortenRateLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 phút (60,000ms)
  max: 100,              // Tối đa 100 request trong windowMs
  standardHeaders: true, // Gửi RateLimit-* headers theo chuẩn RFC
  legacyHeaders: false,  // Tắt X-RateLimit-* headers cũ

  // Custom message trả về dạng JSON thay vì text
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 1 phút.',
      retryAfter: `${Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000)} giây`,
    });
  },
});

/**
 * Rate Limiter cho Auth endpoints (đăng ký/đăng nhập)
 *
 * Nghiêm ngặt hơn: 10 request / IP / 15 phút
 * Chống brute-force tấn công mật khẩu
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 15 phút.',
    });
  },
});

module.exports = { shortenRateLimiter, authRateLimiter };

/**
 * Global Error Handler Middleware
 *
 * Phải đặt SAU TẤT CẢ các routes trong app.js (app.use(errorHandler))
 * Express nhận biết đây là error handler vì có 4 tham số: (err, req, res, next)
 *
 * Chuẩn hóa tất cả lỗi về dạng JSON thống nhất:
 * {
 *   "success": false,
 *   "error": "Mô tả lỗi",
 *   "details": [...] // optional, chỉ có khi có validation errors
 * }
 */

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ nội bộ';

  // --- Xử lý các loại lỗi cụ thể ---

  // Lỗi Mongoose: CastError (sai ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `ID không hợp lệ: ${err.value}`;
  }

  // Lỗi Mongoose: Duplicate key (unique constraint)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Giá trị "${err.keyValue[field]}" đã tồn tại trong hệ thống. Vui lòng dùng giá trị khác cho trường "${field}".`;
  }

  // Lỗi Mongoose: Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join('. ');
  }

  // Lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn. Vui lòng đăng nhập lại.';
  }

  // Log lỗi server (500) để debug — không log 4xx vì đó là lỗi của client
  if (statusCode >= 500) {
    console.error('🔴 Server Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    // Chỉ hiển thị stack trace trong development
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
};

/**
 * Middleware xử lý route không tồn tại (404)
 * Đặt TRƯỚC errorHandler nhưng SAU tất cả routes.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Không tìm thấy route: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };

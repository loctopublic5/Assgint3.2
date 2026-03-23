const express = require('express');
const router = express.Router();

const {
  shortenUrl,
  getStats,
  getUserUrls,
  deleteUrl,
} = require('../controllers/urlController');

const { protect, optionalProtect } = require('../middlewares/auth');
const { shortenRateLimiter } = require('../middlewares/rateLimiter');

// POST /api/shorten — Rút gọn URL
// Rate limit: 100 req/IP/phút
// Auth: Optional (đăng nhập để gắn link vào tài khoản)
router.post('/shorten', shortenRateLimiter, optionalProtect, shortenUrl);

// GET /api/urls — Lấy danh sách link của user đang đăng nhập
// Auth: Bắt buộc JWT
router.get('/urls', protect, getUserUrls);

// GET /api/urls/:shortCode/stats — Xem thống kê một link
// Auth: Không cần
router.get('/urls/:shortCode/stats', getStats);

// DELETE /api/urls/:shortCode — Xóa link (chỉ owner)
// Auth: Bắt buộc JWT
router.delete('/urls/:shortCode', protect, deleteUrl);

module.exports = router;

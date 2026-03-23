const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { authRateLimiter } = require('../middlewares/rateLimiter');

// Áp dụng rate limit cho all auth routes (chống brute-force)
router.use(authRateLimiter);

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me — Lấy profile user hiện tại (cần JWT)
router.get('/me', protect, getMe);

module.exports = router;

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const urlRoutes = require('./src/routes/urlRoutes');
const { redirectUrl } = require('./src/controllers/urlController');
const { errorHandler, notFound } = require('./src/middlewares/errorHandler');

// ─── Kết nối Database ─────────────────────────────────────
connectDB();

// ─── Khởi tạo Express App ─────────────────────────────────
const app = express();

// ─── Global Middlewares ───────────────────────────────────
app.use(cors()); // Cho phép CORS từ mọi origin (tùy chỉnh trong production)
app.use(express.json());            // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body

// ─── Health Check ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🔗 URL Shortener API đang hoạt động!',
    version: '1.0.0',
    docs: {
      shorten: 'POST /api/shorten',
      redirect: 'GET /:shortCode',
      stats: 'GET /api/urls/:shortCode/stats',
      myLinks: 'GET /api/urls (JWT required)',
      deleteLink: 'DELETE /api/urls/:shortCode (JWT required)',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
    },
  });
});

// ─── API Routes ───────────────────────────────────────────
// Auth routes: /api/auth/register, /api/auth/login, /api/auth/me
app.use('/api/auth', authRoutes);

// URL routes: /api/shorten, /api/urls, /api/urls/:shortCode/stats
app.use('/api', urlRoutes);

// ─── Redirect Route ───────────────────────────────────────
// QUAN TRỌNG: Route này phải đặt SAU các /api routes để tránh conflict
// GET /:shortCode → redirect 301 đến URL gốc
app.get('/:shortCode', redirectUrl);

// ─── Error Handling ───────────────────────────────────────
// 404 handler — phải đặt sau tất cả routes
app.use(notFound);

// Global error handler — phải đặt cuối cùng (4 tham số)
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📊 Môi trường: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; // Export để viết tests

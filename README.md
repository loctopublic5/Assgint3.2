# 🔗 URL Shortener API

Dịch vụ rút gọn URL RESTful được xây dựng với **Node.js**, **Express.js** và **MongoDB** — tương tự Bitly. Hỗ trợ xác thực người dùng, custom alias, thống kê click và quản lý link cá nhân.

---

## ✨ Tính năng

| Tính năng | Mô tả |
|---|---|
| 🔗 Rút gọn URL | Tạo short link tự động (6 ký tự) hoặc custom alias |
| ↪️ Redirect 301 | Chuyển hướng vĩnh viễn đến URL gốc, đếm click |
| 📊 Thống kê | Xem số lượt click, thời gian tạo, chủ sở hữu |
| 👤 Xác thực JWT | Đăng ký / đăng nhập, token 7 ngày |
| 🔐 Quản lý link | Xem danh sách link cá nhân, xóa link (chỉ owner) |
| 🛡️ Rate Limiting | 100 req/phút (shorten), 10 req/15 phút (auth) |
| ⚡ Custom Alias | Đặt tên tùy chỉnh cho short link (4–20 ký tự) |

---

## 🏗️ Kiến trúc

```
Assign3.2/
├── app.js                        # Entry point, cấu hình Express
├── src/
│   ├── config/
│   │   └── db.js                 # Kết nối MongoDB
│   ├── controllers/
│   │   ├── authController.js     # Đăng ký, đăng nhập, profile
│   │   └── urlController.js      # Shorten, redirect, stats, CRUD
│   ├── middlewares/
│   │   ├── auth.js               # JWT protect & optionalProtect
│   │   ├── errorHandler.js       # Global error handler + 404
│   │   └── rateLimiter.js        # express-rate-limit configs
│   ├── models/
│   │   ├── User.js               # Schema người dùng (bcrypt)
│   │   └── Url.js                # Schema short link (virtual shortUrl)
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth/*
│   │   └── urlRoutes.js          # /api/shorten, /api/urls/*
│   └── services/
│       ├── shortCodeGenerator.js # nanoid + collision check
│       └── urlValidator.js       # Validate URL hợp lệ
└── .env                          # Biến môi trường
```

---

## 🚀 Cài đặt & Chạy

### Yêu cầu

- **Node.js** >= 18
- **MongoDB** (local hoặc Atlas)

### 1. Clone & cài dependencies

```bash
git clone <repo-url>
cd Assign3.2
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` từ template:

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/url-shortener
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
BASE_URL=http://localhost:5000
```

### 3. Khởi động server

```bash
# Development (nodemon, tự reload)
npm run dev

# Production
npm start
```

Server chạy tại: `http://localhost:5000`

---

## 📡 API Reference

### Base URL: `http://localhost:5000`

### Auth

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký tài khoản | — |
| `POST` | `/api/auth/login` | Đăng nhập, nhận JWT | — |
| `GET` | `/api/auth/me` | Xem thông tin cá nhân | JWT |

### URL

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `POST` | `/api/shorten` | Tạo short link | Optional |
| `GET` | `/:shortCode` | Redirect 301 đến URL gốc | — |
| `GET` | `/api/urls/:shortCode/stats` | Thống kê một link | — |
| `GET` | `/api/urls` | Danh sách link của tôi | JWT |
| `DELETE` | `/api/urls/:shortCode` | Xóa link (chỉ owner) | JWT |

---

## 🧪 Ví dụ sử dụng

### Rút gọn URL (anonymous)

```bash
curl -X POST http://localhost:5000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://www.google.com"}'
```

```json
{
  "success": true,
  "data": {
    "shortCode": "YbJEtC",
    "shortUrl": "http://localhost:5000/YbJEtC",
    "originalUrl": "https://www.google.com",
    "clicks": 0
  }
}
```

### Rút gọn URL với custom alias (cần đăng nhập)

```bash
curl -X POST http://localhost:5000/api/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"originalUrl": "https://github.com", "customAlias": "my-github"}'
```

### Redirect

```bash
curl -L http://localhost:5000/YbJEtC
# → 301 Redirect → https://www.google.com
```

### Đăng nhập

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

---

## 🔒 Xác thực

Các route yêu cầu JWT cần gửi token trong header:

```
Authorization: Bearer <your_jwt_token>
```

Token được cấp sau khi đăng ký hoặc đăng nhập, có hiệu lực 7 ngày.

---

## ⚙️ Giới hạn tốc độ (Rate Limiting)

| Endpoint | Giới hạn |
|---|---|
| `POST /api/shorten` | 100 request / IP / phút |
| `POST /api/auth/*` | 10 request / IP / 15 phút |

---

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4
- **Database:** MongoDB + Mongoose
- **Auth:** jsonwebtoken + bcryptjs
- **ID Generator:** nanoid v5
- **Rate Limit:** express-rate-limit
- **Config:** dotenv

const mongoose = require('mongoose');

/**
 * Kết nối tới MongoDB sử dụng Mongoose.
 * Hàm này được gọi một lần khi server khởi động.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Thoát process với status 1 (lỗi) để tránh server chạy khi không có DB
    process.exit(1);
  }
};

module.exports = connectDB;

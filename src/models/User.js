const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Schema cho User — dùng cho Authentication (Bonus points)
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username là bắt buộc'],
      unique: true,
      trim: true,
      minlength: [3, 'Username phải có ít nhất 3 ký tự'],
      maxlength: [30, 'Username không được quá 30 ký tự'],
    },

    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },

    password: {
      type: String,
      required: [true, 'Password là bắt buộc'],
      minlength: [6, 'Password phải có ít nhất 6 ký tự'],
      // Không select password khi query mặc định (bảo mật)
      select: false,
    },
  },
  {
    timestamps: true, // Tự thêm createdAt và updatedAt
  }
);

/**
 * Middleware pre-save: Hash password trước khi lưu vào DB.
 * Chỉ hash khi password bị thay đổi (tránh double-hash).
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12); // Salt rounds = 12 (đủ mạnh, không quá chậm)
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method: So sánh password đã nhập với hash trong DB.
 * @param {string} candidatePassword - Password nhập vào từ login request
 * @returns {boolean} - true nếu match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

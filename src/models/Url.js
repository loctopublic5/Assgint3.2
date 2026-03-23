const mongoose = require('mongoose');

/**
 * Schema cho URL entity — lưu thông tin mỗi short link
 */
const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: [true, 'URL gốc là bắt buộc'],
      trim: true,
    },

    shortCode: {
      type: String,
      required: true,
      unique: true,     // Đảm bảo unique ở DB level
      index: true,      // Index để tăng tốc độ lookup khi redirect
      trim: true,
      minlength: 4,
      maxlength: 20,    // Cho phép custom alias dài hơn một chút
    },

    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional: gắn link với user đã đăng nhập
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,    // null = anonymous user
    },

    // Tùy chọn: đặt thời hạn cho link (null = vĩnh viễn)
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt tự động
  }
);

/**
 * Virtual field: Trả về full short URL (không lưu vào DB, tính động)
 * Dùng trong toJSON để response trả về shortUrl đầy đủ.
 */
urlSchema.virtual('shortUrl').get(function () {
  return `${process.env.BASE_URL}/${this.shortCode}`;
});

// Đảm bảo virtual fields xuất hiện khi chuyển sang JSON
urlSchema.set('toJSON', { virtuals: true });
urlSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Url', urlSchema);

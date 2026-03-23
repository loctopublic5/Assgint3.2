const { nanoid } = require('nanoid');
const Url = require('../models/Url');

/**
 * Tạo short code ngẫu nhiên và đảm bảo không trùng lặp trong DB.
 *
 * Luồng hoạt động:
 * 1. Sinh mã ngẫu nhiên 6 ký tự với nanoid (alphanumeric).
 * 2. Kiểm tra trong DB xem mã đã tồn tại chưa.
 * 3. Nếu trùng → thử lại (tối đa MAX_ATTEMPTS lần).
 * 4. Nếu hết thử → throw Error (hiếm gặp nhưng cần xử lý).
 *
 * Tại sao dùng nanoid (v3 - CommonJS)?
 * - URL-safe alphabet, không có ký tự đặc biệt
 * - Collision probability cực thấp với 6 ký tự (64^6 = ~68 tỷ khả năng)
 */

const SHORT_CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;

/**
 * Sinh short code duy nhất.
 * @returns {Promise<string>} - Short code chưa tồn tại trong DB
 */
const generateUniqueShortCode = async () => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // nanoid v3 (CommonJS) trả về string đồng bộ
    const code = nanoid(SHORT_CODE_LENGTH);

    // Check collision trong DB
    const existing = await Url.findOne({ shortCode: code });

    if (!existing) {
      return code; // ✅ Mã duy nhất, sử dụng ngay
    }

    console.warn(`⚠️  Short code "${code}" đã tồn tại, đang thử lại (lần ${attempt}/${MAX_ATTEMPTS})...`);
  }

  // Cực kỳ hiếm: sau MAX_ATTEMPTS lần vẫn trùng
  throw new Error('Không thể tạo short code duy nhất sau nhiều lần thử. Vui lòng thử lại.');
};

/**
 * Kiểm tra xem custom alias có hợp lệ về format không.
 * @param {string} alias - Custom alias từ user
 * @returns {boolean}
 */
const isValidAlias = (alias) => {
  // Chỉ cho phép chữ cái, số, dấu gạch ngang và gạch dưới
  const aliasRegex = /^[a-zA-Z0-9_-]{4,20}$/;
  return aliasRegex.test(alias);
};

module.exports = {
  generateUniqueShortCode,
  isValidAlias,
};

/**
 * URL Validator Service
 *
 * Validate URL gốc trước khi rút gọn:
 * - Phải là http hoặc https (không cho phép ftp, javascript:, v.v.)
 * - Phải có domain hợp lệ
 * - Không được rỗng
 *
 * Dùng built-in URL parser của Node.js để parse,
 * sau đó check thêm các điều kiện bảo mật.
 */

/**
 * Danh sách protocol được phép.
 * Chặn javascript:, data:, vbscript:, file: để tránh XSS và tấn công khác.
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Danh sách domain bị chặn (self-referential và loopback).
 */
const BLOCKED_DOMAINS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

/**
 * Kiểm tra URL có hợp lệ và an toàn không.
 * @param {string} url - URL cần kiểm tra
 * @returns {{ valid: boolean, message?: string }}
 */
const validateUrl = (url) => {
  // Kiểm tra không rỗng
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return { valid: false, message: 'URL không được rỗng' };
  }

  // Thử parse URL bằng built-in URL constructor
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { valid: false, message: 'URL không hợp lệ. Vui lòng nhập URL đúng định dạng (ví dụ: https://example.com)' };
  }

  // Kiểm tra protocol (chỉ http/https)
  if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
    return {
      valid: false,
      message: `Chỉ cho phép URL bắt đầu bằng http:// hoặc https://. Protocol "${parsedUrl.protocol}" không được chấp nhận.`,
    };
  }

  // Kiểm tra domain không phải localhost/loopback (chặn SSRF cơ bản)
  const hostname = parsedUrl.hostname.toLowerCase();
  if (BLOCKED_DOMAINS.some((blocked) => hostname === blocked || hostname.endsWith(`.${blocked}`))) {
    return { valid: false, message: 'Không thể rút gọn URL trỏ đến localhost hoặc địa chỉ nội bộ' };
  }

  // Kiểm tra hostname có ký tự hợp lệ (có dấu chấm, không rỗng)
  if (!hostname || !hostname.includes('.')) {
    return { valid: false, message: 'URL phải có domain hợp lệ (ví dụ: example.com)' };
  }

  return { valid: true };
};

module.exports = { validateUrl };

// backend/app/middleware/securityMiddleware.js
const { apiLimiter, aiLimiter } = require('../core/security/security');

module.exports = {
  apiLimiter,
  aiLimiter
};

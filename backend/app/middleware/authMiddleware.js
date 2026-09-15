// backend/app/middleware/authMiddleware.js
const { authenticateToken } = require('../core/authentication/auth');
const { requireRole, requireJobOwnership } = require('../core/authorization/rbac');

module.exports = {
  authenticateToken,
  requireRole,
  requireJobOwnership
};

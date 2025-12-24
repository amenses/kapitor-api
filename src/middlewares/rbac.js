const { roleRepo } = require('../repos');
const { sendError } = require('../utils/response');

/**
 * Require specific roles
 * @param {Array<string>} requiredRoles - Array of allowed roles
 * @returns {Function} Express middleware
 */
function requireRole(requiredRoles = []) {
  return async (req, res, next) => {
    try {
      // Check Firebase custom claim first
      const claimRole = req.userRole;
      if (requiredRoles.includes(claimRole)) {
        return next();
      }

      // Fallback: check database roles
      const userRoles = await roleRepo.getUserRoles(req.user.uid);
      const allowed = userRoles.some((role) => requiredRoles.includes(role));

      if (!allowed) {
        return sendError(res, 'Forbidden: Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      console.error('RBAC check failed:', error);
      return sendError(res, 'Authorization check failed', 500);
    }
  };
}

module.exports = {
  requireRole,
};


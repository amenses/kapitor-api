const pool = require('../db/pool');

// Simple RBAC: check Firebase claim or DB-stored roles
function requireRole(requiredRoles = []) {
  return async (req, res, next) => {
    try {
      const claimRole = req.userRole;
      if (requiredRoles.includes(claimRole)) {
        return next();
      }

      // Fallback: check MySQL roles
      const [rows] = await pool.execute(
        `SELECT r.name
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.uid = ?`,
        [req.user.uid]
      );
      const userRoles = rows.map((r) => r.name);
      const allowed = userRoles.some((r) => requiredRoles.includes(r));
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });
      return next();
    } catch (err) {
      return res.status(500).json({ error: 'RBAC check failed' });
    }
  };
}

module.exports = { requireRole };


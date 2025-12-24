/**
 * Middlewares barrel export
 */
const { verifyFirebaseToken } = require('./auth');
const { requireRole } = require('./rbac');
const { errorHandler } = require('./errorHandler');
const { notFoundHandler } = require('./notFound');

module.exports = {
  verifyFirebaseToken,
  requireRole,
  errorHandler,
  notFoundHandler,
};


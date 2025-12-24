const { sendError } = require('../utils/response');

/**
 * 404 Not Found handler
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
function notFoundHandler(req, res) {
  sendError(res, 'Route not found', 404);
}

module.exports = {
  notFoundHandler,
};


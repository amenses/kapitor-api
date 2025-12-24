/**
 * Standardized API response utility
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code
 */
function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string|Error} error - Error message or Error object
 * @param {number} statusCode - HTTP status code
 * @param {*} details - Additional error details
 */
function sendError(res, error, statusCode = 500, details = null) {
  const message = error instanceof Error ? error.message : error;
  const response = {
    success: false,
    error: message,
  };

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  sendSuccess,
  sendError,
};


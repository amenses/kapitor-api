const Joi = require('joi');
const { sendError } = require('./response');

/**
 * Validate request using Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - 'body', 'query', or 'params'
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return sendError(res, 'Validation error', 400, errors);
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
}

module.exports = {
  validate,
};


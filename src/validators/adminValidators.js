const Joi = require('joi');

const assignRoleSchema = Joi.object({
  role: Joi.string().required(),
});

const listUsersQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(200).default(50),
  offset: Joi.number().integer().min(0).default(0),
});

module.exports = {
  assignRoleSchema,
  listUsersQuerySchema,
};


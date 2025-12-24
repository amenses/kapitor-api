const Joi = require('joi');

const bootstrapSchema = Joi.object({
  referralCode: Joi.string().max(32).optional(),
  deviceInfo: Joi.object().unknown(true).optional(),
});

const updateProfileSchema = Joi.object({
  fullName: Joi.string().max(255).optional(),
  phone: Joi.string().max(32).optional(),
  preferences: Joi.object().unknown(true).optional(),
});

module.exports = {
  bootstrapSchema,
  updateProfileSchema,
};


const Joi = require('joi');

const linkBankAccountSchema = Joi.object({
  accountHolder: Joi.string().min(3).max(128).required(),
  bankAccountNumber: Joi.string().pattern(/^[0-9]{6,18}$/).required(),
  ifsc: Joi.string().length(11).alphanum().required(),
  bankName: Joi.string().max(128).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().max(16).optional(),
});

const depositIntentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default('INR'),
  reference: Joi.string().max(64).optional(),
});

module.exports = {
  linkBankAccountSchema,
  depositIntentSchema,
};

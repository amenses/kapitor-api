const Joi = require('joi');

const createWalletSchema = Joi.object({
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().min(8).required(),
});

const confirmMnemonicSchema = Joi.object({
  answers: Joi.object().pattern(/^[0-9]+$/, Joi.string().required()).required(),
});

const unlockSchema = Joi.object({
  password: Joi.string().required(),
});

module.exports = {
  createWalletSchema,
  confirmMnemonicSchema,
  unlockSchema,
};

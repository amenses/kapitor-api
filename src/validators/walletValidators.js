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

const sendCryptoSchema = Joi.object({
  password: Joi.string().min(8).required(),
  to: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  amount: Joi.string().pattern(/^\d+(\.\d+)?$/).required(),
});

const sendTokenSchema = Joi.object({
  password: Joi.string().min(8).required(),
  to: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  amount: Joi.number().positive().required(),
});

module.exports = {
  createWalletSchema,
  confirmMnemonicSchema,
  unlockSchema,
  sendCryptoSchema,
  sendTokenSchema,
};

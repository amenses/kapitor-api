/**
 * Validators barrel export
 */
const { bootstrapSchema, updateProfileSchema } = require('./userValidators');
const { kycUpdateSchema, digilockerCallbackSchema } = require('./kycValidators');
const { assignRoleSchema, listUsersQuerySchema } = require('./adminValidators');
const { createWalletSchema, confirmMnemonicSchema, unlockSchema } = require('./walletValidators');

module.exports = {
  bootstrapSchema,
  updateProfileSchema,
  kycUpdateSchema,
  digilockerCallbackSchema,
  assignRoleSchema,
  listUsersQuerySchema,
  createWalletSchema,
  confirmMnemonicSchema,
  unlockSchema,
};


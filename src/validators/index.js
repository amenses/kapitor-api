/**
 * Validators barrel export
 */
const { bootstrapSchema, updateProfileSchema } = require('./userValidators');
const { kycUpdateSchema, digilockerCallbackSchema } = require('./kycValidators');
const { assignRoleSchema, listUsersQuerySchema } = require('./adminValidators');
const { createWalletSchema, confirmMnemonicSchema, unlockSchema, sendCryptoSchema, sendTokenSchema } = require('./walletValidators');
const {
  updateSectionSchema,
  uploadDocumentSchema,
  approveSchema,
  rejectSchema,
  actionRequiredSchema,
  reviewSchema,
} = require('./kybValidators');
const { linkBankAccountSchema, depositIntentSchema } = require('./fiatValidators');

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
  sendCryptoSchema,
  sendTokenSchema,
  updateSectionSchema,
  uploadDocumentSchema,
  approveSchema,
  rejectSchema,
  actionRequiredSchema,
  reviewSchema,
  linkBankAccountSchema,
  depositIntentSchema,
};

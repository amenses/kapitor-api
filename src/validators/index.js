/**
 * Validators barrel export
 */
const { bootstrapSchema, updateProfileSchema } = require('./userValidators');
const { kycUpdateSchema, digilockerCallbackSchema } = require('./kycValidators');
const { assignRoleSchema, listUsersQuerySchema } = require('./adminValidators');

module.exports = {
  bootstrapSchema,
  updateProfileSchema,
  kycUpdateSchema,
  digilockerCallbackSchema,
  assignRoleSchema,
  listUsersQuerySchema,
};


/**
 * Models barrel export
 */
const User = require('./User');
const UserProfile = require('./UserProfile');
const Role = require('./Role');
const UserRole = require('./UserRole');
const KycStatus = require('./KycStatus');
const KycDocument = require('./KycDocument');
const DigilockerToken = require('./DigilockerToken');
const UserBootstrapEvent = require('./UserBootstrapEvent');
const WalletDetails = require('./WalletDetails');

module.exports = {
  User,
  UserProfile,
  Role,
  UserRole,
  KycStatus,
  KycDocument,
  DigilockerToken,
  UserBootstrapEvent,
  WalletDetails,
};


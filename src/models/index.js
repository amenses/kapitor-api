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
const FiatAccount = require('./FiatAccount');
const FiatLedger = require('./FiatLedger');
const KybStatus = require('./KybStatus');
const KybSection = require('./KybSection');
const KybDocument = require('./KybDocument');
const Transaction = require('./Transaction');
const DepositRequest = require('./DepositRequest');

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
  FiatAccount,
  FiatLedger,
  KybStatus,
  KybSection,
  KybDocument,
  Transaction,
  DepositRequest
};

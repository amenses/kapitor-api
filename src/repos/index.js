/**
 * Repositories barrel export
 */
const userRepo = require('./userRepo');
const userProfileRepo = require('./userProfileRepo');
const roleRepo = require('./roleRepo');
const kycRepo = require('./kycRepo');
const digilockerRepo = require('./digilockerRepo');
const userBootstrapRepo = require('./userBootstrapRepo');
const walletDetailsRepo = require('./walletDetails');
const kybRepo = require('./kybRepo');
const transactionRepo = require('./transactionRepo');
const depositRequestRepo = require('./depositRequest');
const fiatAccountRepo = require('./fiatAccount');
const fiatLedgerRepo = require('./fiatLedger');

module.exports = {
  userRepo,
  userProfileRepo,
  roleRepo,
  kycRepo,
  digilockerRepo,
  userBootstrapRepo,
  walletDetailsRepo,
  kybRepo,
  transactionRepo,
  depositRequestRepo,
  fiatAccountRepo,
  fiatLedgerRepo
};

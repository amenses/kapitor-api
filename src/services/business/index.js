/**
 * Business services barrel export
 */
const userService = require('./userService');
const kycService = require('./kycService');
const adminService = require('./adminService');
const walletService = require('./walletService');
const kapitorTokenService = require('./kapitorTokenService');
const tokenTransferService = require('./tokenTransferService');
const balanceService = require('./balanceService');
const fiatAccountService = require('./fiatAccountService');
const fiatDepositService = require('./fiatDepositService');
const kybService = require('./kybService');
const transactionService = require('./transactionService');

module.exports = {
  userService,
  kycService,
  adminService,
  walletService,
  kapitorTokenService,
  tokenTransferService,
  balanceService,
  fiatAccountService,
  fiatDepositService,
  kybService,
  transactionService
};

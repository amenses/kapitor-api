/**
 * Services barrel export
 */
const { digilockerService, paymentGatewayService } = require('./external');
const {
  userService,
  kycService,
  adminService,
  walletService,
  kybService,
  transactionService,
  fiatAccountService,
  fiatDepositService,
  balanceService,
  tokenTransferService,
  kapitorTokenService,
} = require('./business');

module.exports = {
  digilockerService,
  paymentGatewayService,
  userService,
  kycService,
  adminService,
  walletService,
  kybService,
  transactionService,
  fiatAccountService,
  fiatDepositService,
  balanceService,
  tokenTransferService,
  kapitorTokenService,
};

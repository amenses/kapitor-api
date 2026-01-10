/**
 * Services barrel export
 */
const { digilockerService } = require('./external');
const { userService, kycService, adminService, walletService, kybService, transactionService } = require('./business');

module.exports = {
  digilockerService,
  userService,
  kycService,
  adminService,
  walletService,
  kybService,
  transactionService
};


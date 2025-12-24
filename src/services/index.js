/**
 * Services barrel export
 */
const { digilockerService } = require('./external');
const { userService, kycService, adminService, walletService } = require('./business');

module.exports = {
  digilockerService,
  userService,
  kycService,
  adminService,
  walletService,
};


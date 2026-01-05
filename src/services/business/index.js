/**
 * Business services barrel export
 */
const userService = require('./userService');
const kycService = require('./kycService');
const adminService = require('./adminService');
const walletService = require('./walletService');
const kybService = require('./kybService');

module.exports = {
  userService,
  kycService,
  adminService,
  walletService,
  kybService,
};


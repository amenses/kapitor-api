/**
 * Business services barrel export
 */
const userService = require('./userService');
const kycService = require('./kycService');
const adminService = require('./adminService');

module.exports = {
  userService,
  kycService,
  adminService,
};


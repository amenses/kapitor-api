/**
 * Services barrel export
 */
const { digilockerService } = require('./external');
const { userService, kycService, adminService } = require('./business');

module.exports = {
  digilockerService,
  userService,
  kycService,
  adminService,
};


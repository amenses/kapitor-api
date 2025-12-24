/**
 * Repositories barrel export
 */
const userRepo = require('./userRepo');
const userProfileRepo = require('./userProfileRepo');
const roleRepo = require('./roleRepo');
const kycRepo = require('./kycRepo');
const digilockerRepo = require('./digilockerRepo');
const userBootstrapRepo = require('./userBootstrapRepo');

module.exports = {
  userRepo,
  userProfileRepo,
  roleRepo,
  kycRepo,
  digilockerRepo,
  userBootstrapRepo,
};


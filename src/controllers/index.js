/**
 * Controllers barrel export
 */
const userController = require('./userController');
const kycController = require('./kycController');
const adminController = require('./adminController');
const walletController = require('./walletController');

module.exports = {
  userController,
  kycController,
  adminController,
  walletController,
};


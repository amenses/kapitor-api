/**
 * Controllers barrel export
 */
const userController = require('./userController');
const kycController = require('./kycController');
const adminController = require('./adminController');
const walletController = require('./walletController');
const kybController = require('./kybController');
const transactionController = require('./transactionController');
const fiatController = require('./fiatController');

module.exports = {
  userController,
  kycController,
  adminController,
  walletController,
  kybController,
  transactionController,
  fiatController
};

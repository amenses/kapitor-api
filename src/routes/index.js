/**
 * Routes barrel export
 */
const usersRouter = require('./users');
const kycRouter = require('./kyc');
const adminRouter = require('./admin');
const walletRouter = require('./wallet');

module.exports = {
  usersRouter,
  kycRouter,
  adminRouter,
  walletRouter,
};


/**
 * Routes barrel export
 */
const usersRouter = require('./users');
const kycRouter = require('./kyc');
const adminRouter = require('./admin');
const walletRouter = require('./wallet');
const kybRouter = require('./kyb');

module.exports = {
  usersRouter,
  kycRouter,
  adminRouter,
  walletRouter,
  kybRouter,
};


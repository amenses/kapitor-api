/**
 * Routes barrel export
 */
const usersRouter = require('./users');
const kycRouter = require('./kyc');
const adminRouter = require('./admin');

module.exports = {
  usersRouter,
  kycRouter,
  adminRouter,
};


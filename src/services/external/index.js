/**
 * External services barrel export
 */
const digilockerService = require('./digilockerService');
const paymentGatewayService = require('./paymentGatewayService');

module.exports = {
  digilockerService,
  paymentGatewayService,
};

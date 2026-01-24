const { fiatAccountService, fiatDepositService } = require('../services');
const { sendSuccess } = require('../utils/response');

class FiatController {
  async linkAccount(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await fiatAccountService.linkAccount(uid, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAccount(req, res, next) {
    try {
      const { uid } = req.user;
      const account = await fiatAccountService.getAccount(uid);
      sendSuccess(res, account, 200);
    } catch (error) {
      next(error);
    }
  }

  async createDepositIntent(req, res, next) {
    try {
      const { uid } = req.user;
      const intent = await fiatDepositService.createDepositIntent(uid, req.body);
      sendSuccess(res, intent, 201);
    } catch (error) {
      next(error);
    }
  }

  async handleStripeWebhook(req, res, next) {
    try {
      const rawBody = req.rawBody || JSON.stringify(req.body || {});
      const result = await fiatDepositService.handleGatewayWebhook(rawBody, req.headers);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FiatController();

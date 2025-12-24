const { walletService } = require('../services');
const { sendSuccess } = require('../utils/response');

class WalletController {
  async create(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await walletService.create(uid, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async confirmMnemonic(req, res, next) {
    try {
      const { uid } = req.user;
      const { answers } = req.body;
      const result = await walletService.confirmMnemonic(uid, answers);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async unlock(req, res, next) {
    try {
      const { uid } = req.user;
      const { password } = req.body;
      const result = await walletService.unlock(uid, password);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WalletController();

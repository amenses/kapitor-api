const { walletService } = require('../services');
const { sendSuccess } = require('../utils/response');

class WalletController {
  /**
   * Create wallet for user
   */
  async create(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await walletService.create(uid, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm mnemonic words
   */
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

  /**
   * Unlock wallet (password validation)
   */
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

  /**
   * Get wallet balance
   */
  async getBalance(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await walletService.getBalance(uid);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send crypto from wallet
   */
  async sendCrypto(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await walletService.sendCrypto(uid, req.body);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet address to receive crypto
   */
  async receiveCrypto(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await walletService.receiveCrypto(uid);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WalletController();

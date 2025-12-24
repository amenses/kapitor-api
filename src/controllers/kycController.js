const { kycService } = require('../services');
const { sendSuccess, sendError } = require('../utils/response');

class KycController {
  /**
   * Get KYC status
   */
  async getStatus(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await kycService.getStatus(uid);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update KYC
   */
  async update(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await kycService.update(uid, req.body);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get DigiLocker authorization URL
   */
  async getDigilockerAuthUrl(req, res, next) {
    try {
      const result = kycService.getDigilockerAuthUrl();
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle DigiLocker callback
   */
  async digilockerCallback(req, res, next) {
    try {
      const { uid } = req.user;
      const { code } = req.body;
      const result = await kycService.linkDigilocker(uid, code);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get DigiLocker documents
   */
  async getDigilockerDocuments(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await kycService.getDigilockerDocuments(uid);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new KycController();


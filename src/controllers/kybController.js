const { kybService } = require('../services');
const { sendSuccess, sendError } = require('../utils/response');

class KybController {
  /**
   * Start KYB process
   */
  async start(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await kybService.start(uid);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get KYB status
   */
  async getStatus(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await kybService.getStatus(uid);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get section data
   */
  async getSection(req, res, next) {
    try {
      const { uid } = req.user;
      const { kybId, sectionKey } = req.params;
      const result = await kybService.getSection(uid, sectionKey, kybId);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get multiple sections (param-based)
   */
  async getSections(req, res, next) {
    try {
      const { uid } = req.user;
      const { kybId } = req.params;
      const { keys } = req.query;

      // Parse keys query param (comma-separated)
      let sectionKeys = null;
      if (keys) {
        sectionKeys = keys.split(',').map((k) => k.trim()).filter(Boolean);
      }

      const result = await kybService.getSections(uid, kybId, sectionKeys);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update section data
   */
  async updateSection(req, res, next) {
    try {
      const { uid } = req.user;
      const { kybId, sectionKey } = req.params;
      const result = await kybService.updateSection(uid, sectionKey, req.body, kybId);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit KYB application
   */
  async submit(req, res, next) {
    try {
      const { uid } = req.user;
      const { kybId } = req.params;
      const result = await kybService.submit(uid, kybId);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload document
   */
  async uploadDocument(req, res, next) {
    try {
      const { uid } = req.user;
      const { kybId } = req.params;
      const { sectionKey } = req.body;
      const result = await kybService.uploadDocument(uid, sectionKey, req.body, kybId);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get documents
   */
  async getDocuments(req, res, next) {
    try {
      const { uid } = req.user;
      const { kybId } = req.params;
      const { sectionKey } = req.query;
      const result = await kybService.getDocuments(uid, sectionKey || null, kybId);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve KYB (admin/compliance)
   */
  async approve(req, res, next) {
    try {
      const { uid } = req.params;
      const { kybId } = req.params;
      const result = await kybService.approve(uid, kybId, req.body);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject KYB (admin/compliance)
   */
  async reject(req, res, next) {
    try {
      const { uid } = req.params;
      const { kybId } = req.params;
      const result = await kybService.reject(uid, kybId, req.body);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark action required (admin/compliance)
   */
  async markActionRequired(req, res, next) {
    try {
      const { uid } = req.params;
      const { kybId } = req.params;
      const result = await kybService.markActionRequired(uid, kybId, req.body);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unified admin review API
   */
  async review(req, res, next) {
    try {
      const { uid } = req.params;
      const { kybId } = req.params;
      const result = await kybService.review(uid, kybId, req.body);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new KybController();


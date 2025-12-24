const { adminService } = require('../services');
const { sendSuccess, sendError } = require('../utils/response');

class AdminController {
  /**
   * Assign role to user
   */
  async assignRole(req, res, next) {
    try {
      const { uid } = req.params;
      const { role } = req.body;
      const result = await adminService.assignRole(uid, role);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List users
   */
  async listUsers(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const result = await adminService.listUsers({ limit, offset });
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();


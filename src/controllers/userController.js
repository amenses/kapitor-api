const { userService } = require('../services');
const { sendSuccess, sendError } = require('../utils/response');

class UserController {
  /**
   * Bootstrap user (first-time setup)
   */
  async bootstrap(req, res, next) {
    try {
      const { referralCode, deviceInfo } = req.body;
      const { uid, email, phone, claims } = req.user;

      const result = await userService.bootstrap(
        {
          uid,
          email,
          phone,
          displayName: claims.name || null,
          photoUrl: claims.picture || null,
          providerIds: claims.firebase?.sign_in_provider ? [claims.firebase.sign_in_provider] : [],
        },
        { referralCode, deviceInfo }
      );

      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await userService.getProfile(uid);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await userService.updateProfile(uid, req.body);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user roles
   */
  async getRoles(req, res, next) {
    try {
      const { uid } = req.user;
      const result = await userService.getRoles(uid);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();


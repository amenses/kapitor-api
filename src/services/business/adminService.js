const { userRepo, roleRepo, kycRepo } = require('../../repos');
const { getAdmin } = require('../../config');

class AdminService {
  /**
   * Assign role to user
   * @param {string} uid
   * @param {string} roleName
   * @returns {Promise<Object>}
   */
  async assignRole(uid, roleName) {
    // Ensure role exists in database
    await roleRepo.createIfNotExists(roleName);

    // Assign role in database
    await roleRepo.assignRole(uid, roleName);

    // Update Firebase custom claims
    const admin = getAdmin();
    const firebaseUser = await admin.auth().getUser(uid);
    const currentClaims = firebaseUser.customClaims || {};
    await admin.auth().setCustomUserClaims(uid, { ...currentClaims, role: roleName });

    return { status: 'ok', role: roleName };
  }

  /**
   * List users with pagination
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async listUsers(options = {}) {
    const { limit = 50, offset = 0 } = options;
    const result = await userRepo.list({ limit, offset });

    // Enrich with KYC status
    const enrichedData = await Promise.all(
      result.data.map(async (user) => {
        const kycStatus = await kycRepo.findStatusByUid(user.uid);
        return {
          uid: user.uid,
          email: user.email,
          phone: user.phone,
          kyc_status: kycStatus ? kycStatus.status : null,
        };
      })
    );

    return {
      data: enrichedData,
      limit: result.limit,
      offset: result.offset,
      total: result.total,
    };
  }
}

module.exports = new AdminService();


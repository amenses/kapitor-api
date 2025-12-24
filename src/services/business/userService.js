const { userRepo, userProfileRepo, roleRepo, kycRepo, userBootstrapRepo } = require('../../repos');
const { getAdmin } = require('../../config');

class UserService {
  /**
   * Bootstrap user (first-time setup)
   * @param {Object} userData
   * @param {Object} bootstrapData
   * @returns {Promise<Object>}
   */
  async bootstrap(userData, bootstrapData = {}) {
    const { uid, email, phone, displayName, photoUrl, providerIds } = userData;
    const { referralCode, deviceInfo } = bootstrapData;

    // Upsert user
    const user = await userRepo.upsert({
      uid,
      email,
      phone,
      displayName,
      photoUrl,
      providerIds,
    });

    // Create profile if not exists
    await userProfileRepo.upsert(uid, {
      preferences: {},
    });

    // Create KYC status if not exists
    await kycRepo.upsertStatus(uid, {
      status: 'not_started',
    });

    // Store bootstrap event
    if (referralCode || deviceInfo) {
      await userBootstrapRepo.create({
        uid,
        referralCode: referralCode || null,
        deviceInfo: deviceInfo || {},
      });
    }

    // Set default role claim in Firebase if not exists
    const admin = getAdmin();
    const firebaseUser = await admin.auth().getUser(uid);
    const currentClaims = firebaseUser.customClaims || {};
    if (!currentClaims.role) {
      await admin.auth().setCustomUserClaims(uid, { ...currentClaims, role: 'user' });
    }

    return {
      user: {
        uid: user.uid,
        email: user.email,
        phone: user.phone,
        role: currentClaims.role || 'user',
      },
    };
  }

  /**
   * Get user profile with related data
   * @param {string} uid
   * @returns {Promise<Object>}
   */
  async getProfile(uid) {
    const [user, profile, kycStatus] = await Promise.all([
      userRepo.findByUid(uid),
      userProfileRepo.findByUid(uid),
      kycRepo.findStatusByUid(uid),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      user: user.toObject ? user.toObject() : user,
      profile: profile ? (profile.toObject ? profile.toObject() : profile) : null,
      kycStatus: kycStatus ? (kycStatus.toObject ? kycStatus.toObject() : kycStatus) : null,
    };
  }

  /**
   * Update user profile
   * @param {string} uid
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateProfile(uid, updateData) {
    const { fullName, phone, preferences } = updateData;

    const updates = {};

    if (phone) {
      await userRepo.update(uid, { phone });
    }

    if (fullName !== undefined || preferences !== undefined) {
      if (fullName !== undefined) updates.fullName = fullName;
      if (preferences !== undefined) updates.preferences = preferences;
      await userProfileRepo.update(uid, updates);
    }

    return { status: 'ok' };
  }

  /**
   * Get user roles
   * @param {string} uid
   * @returns {Promise<Array>}
   */
  async getRoles(uid) {
    const roles = await roleRepo.getUserRoles(uid);
    return { roles };
  }
}

module.exports = new UserService();


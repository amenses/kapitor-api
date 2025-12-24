const { UserProfile } = require('../models');

class UserProfileRepository {
  /**
   * Find profile by UID
   * @param {string} uid
   * @returns {Promise<Object|null>}
   */
  async findByUid(uid) {
    return UserProfile.findOne({ uid });
  }

  /**
   * Create profile
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  async create(profileData) {
    const profile = new UserProfile(profileData);
    return profile.save();
  }

  /**
   * Create or update profile
   * @param {string} uid
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  async upsert(uid, profileData) {
    return UserProfile.findOneAndUpdate(
      { uid },
      { uid, ...profileData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  /**
   * Update profile
   * @param {string} uid
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  async update(uid, updateData) {
    return UserProfile.findOneAndUpdate({ uid }, updateData, { new: true });
  }
}

module.exports = new UserProfileRepository();


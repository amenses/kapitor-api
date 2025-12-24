const { User } = require('../models');

class UserRepository {
  /**
   * Find user by UID
   * @param {string} uid
   * @returns {Promise<Object|null>}
   */
  async findByUid(uid) {
    return User.findOne({ uid });
  }

  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  /**
   * Create or update user
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async upsert(userData) {
    const { uid, email, phone, displayName, photoUrl, providerIds, isKapitorWallet } = userData;
    return User.findOneAndUpdate(
      { uid },
      {
        uid,
        email: email?.toLowerCase(),
        phone,
        displayName,
        photoUrl,
        providerIds: providerIds || [],
        isKapitorWallet: isKapitorWallet !== undefined ? isKapitorWallet : false,
        lastLoginAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  /**
   * Update user
   * @param {string} uid
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  async update(uid, updateData) {
    return User.findOneAndUpdate({ uid }, updateData, { new: true });
  }

  /**
   * List users with pagination
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async list({ limit = 50, offset = 0, sort = { createdAt: -1 } } = {}) {
    const users = await User.find()
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await User.countDocuments();

    return {
      data: users,
      limit,
      offset,
      total,
    };
  }
}

module.exports = new UserRepository();


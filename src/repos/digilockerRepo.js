const { DigilockerToken } = require('../models');

class DigilockerRepository {
  /**
   * Find token by UID
   * @param {string} uid
   * @returns {Promise<Object|null>}
   */
  async findByUid(uid) {
    return DigilockerToken.findOne({ uid });
  }

  /**
   * Create or update token
   * @param {string} uid
   * @param {Object} tokenData
   * @returns {Promise<Object>}
   */
  async upsert(uid, tokenData) {
    return DigilockerToken.findOneAndUpdate(
      { uid },
      { uid, ...tokenData },
      { upsert: true, new: true }
    );
  }

  /**
   * Delete token
   * @param {string} uid
   * @returns {Promise<boolean>}
   */
  async delete(uid) {
    const result = await DigilockerToken.deleteOne({ uid });
    return result.deletedCount > 0;
  }
}

module.exports = new DigilockerRepository();


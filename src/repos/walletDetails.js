const { WalletDetails } = require('../models');

class WalletDetailsRepository {
  /**
   * Find wallet by user uid
   * @param {string} uid
   * @returns {Promise<Object|null>}
   */
  async findByUid(uid) {
    return WalletDetails.findOne({ uid });
  }

  /**
   * Find wallet by wallet address
   * @param {string} walletAddress
   * @returns {Promise<Object|null>}
   */
  async findByWalletAddress(walletAddress) {
    return WalletDetails.findOne({ walletAddress });
  }

  /**
   * Create wallet details
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    return WalletDetails.create(data);
  }

  /**
   * Update wallet by wallet address
   * @param {string} walletAddress
   * @param {Object} update
   * @returns {Promise<Object|null>}
   */
  async updateByWalletAddress(walletAddress, update) {
    return WalletDetails.findOneAndUpdate({ walletAddress }, update, { new: true });
  }
}

module.exports = new WalletDetailsRepository();

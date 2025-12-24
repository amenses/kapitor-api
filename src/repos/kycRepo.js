const { KycStatus, KycDocument } = require('../models');

class KycRepository {
  /**
   * Find KYC status by UID
   * @param {string} uid
   * @returns {Promise<Object|null>}
   */
  async findStatusByUid(uid) {
    return KycStatus.findOne({ uid });
  }

  /**
   * Create or update KYC status
   * @param {string} uid
   * @param {Object} statusData
   * @returns {Promise<Object>}
   */
  async upsertStatus(uid, statusData) {
    const updateData = { uid, ...statusData };

    if (statusData.status === 'submitted' && !statusData.submittedAt) {
      updateData.submittedAt = new Date();
    }

    if (statusData.status === 'verified' && !statusData.verifiedAt) {
      updateData.verifiedAt = new Date();
    }

    return KycStatus.findOneAndUpdate(
      { uid },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  /**
   * Find KYC documents by UID
   * @param {string} uid
   * @returns {Promise<Object|null>}
   */
  async findDocumentsByUid(uid) {
    return KycDocument.findOne({ uid });
  }

  /**
   * Create or update KYC documents
   * @param {string} uid
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async upsertDocuments(uid, payload) {
    return KycDocument.findOneAndUpdate(
      { uid },
      { uid, payload },
      { upsert: true, new: true }
    );
  }
}

module.exports = new KycRepository();


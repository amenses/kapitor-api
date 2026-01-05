const { KybStatus, KybSection, KybDocument } = require('../models');

class KybRepository {
  /**
   * Find KYB status by UID
   * @param {string} uid
   * @returns {Promise<Object|null>}
   */
  async findStatusByUid(uid) {
    return KybStatus.findOne({ uid });
  }

  /**
   * Create or update KYB status
   * @param {string} uid
   * @param {Object} statusData
   * @returns {Promise<Object>}
   */
  async upsertStatus(uid, statusData) {
    const updateData = { uid, ...statusData };

    if (statusData.status === 'SUBMITTED' && !statusData.submittedAt) {
      updateData.submittedAt = new Date();
    }

    if (statusData.status === 'APPROVED' && !statusData.approvedAt) {
      updateData.approvedAt = new Date();
    }

    if (statusData.status === 'REJECTED' && !statusData.rejectedAt) {
      updateData.rejectedAt = new Date();
    }

    return KybStatus.findOneAndUpdate(
      { uid },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  /**
   * Find KYB section by UID and section key
   * @param {string} uid
   * @param {string} sectionKey
   * @returns {Promise<Object|null>}
   */
  async findSectionByUidAndKey(uid, sectionKey) {
    return KybSection.findOne({ uid, sectionKey });
  }

  /**
   * Find all sections for a user
   * @param {string} uid
   * @returns {Promise<Array>}
   */
  async findSectionsByUid(uid) {
    return KybSection.find({ uid }).sort({ sectionKey: 1 });
  }

  /**
   * Create or update KYB section
   * @param {string} uid
   * @param {string} sectionKey
   * @param {Object} sectionData
   * @returns {Promise<Object>}
   */
  async upsertSection(uid, sectionKey, sectionData) {
    const updateData = {
      uid,
      sectionKey,
      ...sectionData,
    };

    if (sectionData.status === 'COMPLETED' && !sectionData.completedAt) {
      updateData.completedAt = new Date();
    }

    return KybSection.findOneAndUpdate(
      { uid, sectionKey },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  /**
   * Find KYB documents by UID and optional section key
   * @param {string} uid
   * @param {string} sectionKey (optional)
   * @returns {Promise<Array>}
   */
  async findDocumentsByUid(uid, sectionKey = null) {
    const query = { uid };
    if (sectionKey) {
      query.sectionKey = sectionKey;
    }
    return KybDocument.find(query).sort({ uploadedAt: -1 });
  }

  /**
   * Create KYB document
   * @param {Object} documentData
   * @returns {Promise<Object>}
   */
  async createDocument(documentData) {
    return KybDocument.create(documentData);
  }

  /**
   * Find document by ID
   * @param {string} documentId
   * @returns {Promise<Object|null>}
   */
  async findDocumentById(documentId) {
    return KybDocument.findById(documentId);
  }

  /**
   * Update document
   * @param {string} documentId
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  async updateDocument(documentId, updateData) {
    if (updateData.reviewStatus === 'APPROVED' || updateData.reviewStatus === 'REJECTED') {
      if (!updateData.reviewedAt) {
        updateData.reviewedAt = new Date();
      }
    }
    return KybDocument.findByIdAndUpdate(documentId, updateData, { new: true });
  }

  /**
   * Delete document
   * @param {string} documentId
   * @returns {Promise<Object|null>}
   */
  async deleteDocument(documentId) {
    return KybDocument.findByIdAndDelete(documentId);
  }

  /**
   * Count documents by UID and section key
   * @param {string} uid
   * @param {string} sectionKey
   * @returns {Promise<number>}
   */
  async countDocumentsByUidAndSection(uid, sectionKey) {
    return KybDocument.countDocuments({ uid, sectionKey });
  }
}

module.exports = new KybRepository();


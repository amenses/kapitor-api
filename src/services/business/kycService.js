const { kycRepo } = require('../../repos');
const { digilockerService } = require('../external');

class KycService {
  /**
   * Get KYC status
   * @param {string} uid
   * @returns {Promise<Object>}
   */
  async getStatus(uid) {
    const kyc = await kycRepo.findStatusByUid(uid);
    return { kyc: kyc ? (kyc.toObject ? kyc.toObject() : kyc) : null };
  }

  /**
   * Update KYC status and documents
   * @param {string} uid
   * @param {Object} kycData
   * @returns {Promise<Object>}
   */
  async update(uid, kycData) {
    const { status, ...fileUrls } = kycData;

    // Filter out empty file URLs
    const documents = Object.entries(fileUrls).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {});

    // Update status
    const statusUpdate = status ? { status } : {};
    if (Object.keys(statusUpdate).length > 0) {
      await kycRepo.upsertStatus(uid, statusUpdate);
    }

    // Update documents if provided
    if (Object.keys(documents).length > 0) {
      await kycRepo.upsertDocuments(uid, documents);
    }

    // Get updated status
    const updatedStatus = await kycRepo.findStatusByUid(uid);
    return {
      status: updatedStatus ? updatedStatus.status : status || 'in_progress',
    };
  }

  /**
   * Get DigiLocker authorization URL
   * @returns {Object}
   */
  getDigilockerAuthUrl() {
    return digilockerService.getAuthorizationUrl();
  }

  /**
   * Link DigiLocker account
   * @param {string} uid
   * @param {string} code
   * @returns {Promise<Object>}
   */
  async linkDigilocker(uid, code) {
    return digilockerService.linkAccount(uid, code);
  }

  /**
   * Get DigiLocker documents and persist snapshot
   * @param {string} uid
   * @returns {Promise<Object>}
   */
  async getDigilockerDocuments(uid) {
    const documents = await digilockerService.getUserDocuments(uid);

    // Persist snapshot for auditing
    await kycRepo.upsertDocuments(uid, { digilocker: documents });

    return { documents };
  }
}

module.exports = new KycService();


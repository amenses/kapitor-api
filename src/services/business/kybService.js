const { kybRepo } = require('../../repos');

// Valid status transitions
const VALID_TRANSITIONS = {
  NOT_STARTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['SUBMITTED', 'NOT_STARTED'],
  SUBMITTED: ['UNDER_REVIEW', 'IN_PROGRESS'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'ACTION_REQUIRED', 'SUBMITTED'],
  ACTION_REQUIRED: ['IN_PROGRESS', 'SUBMITTED'],
  APPROVED: [],
  REJECTED: ['IN_PROGRESS'],
};

// Required sections for submission
const REQUIRED_SECTIONS = [
  'BUSINESS_PROFILE',
  'BUSINESS_IDENTITY',
  'BUSINESS_ADDRESS',
  'OWNERSHIP_STRUCTURE',
  'MANAGEMENT_AUTHORITY',
  'STATUTORY_DOCUMENTS',
  'BANK_ACCOUNT_DECLARATION',
  'BUSINESS_ACTIVITY_DECLARATION',
  'RISK_REGULATORY_DECLARATIONS',
];

class KybService {
  /**
   * Validate status transition
   * @param {string} currentStatus
   * @param {string} newStatus
   * @throws {Error} If transition is invalid
   */
  _validateStatusTransition(currentStatus, newStatus) {
    if (currentStatus === newStatus) {
      return; // Same status is allowed
    }

    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`
      );
    }
  }

  /**
   * Start KYB process
   * @param {string} uid
   * @returns {Promise<Object>}
   */
  async start(uid) {
    const existing = await kybRepo.findStatusByUid(uid);
    if (existing && existing.status !== 'NOT_STARTED' && existing.status !== 'REJECTED') {
      throw new Error('KYB application already exists and cannot be restarted');
    }

    const status = existing && existing.status === 'REJECTED' ? 'IN_PROGRESS' : 'IN_PROGRESS';
    const kybStatus = await kybRepo.upsertStatus(uid, { status });

    return {
      kybId: kybStatus._id.toString(),
      status: kybStatus.status,
      uid: kybStatus.uid,
    };
  }

  /**
   * Get KYB status
   * @param {string} uid
   * @returns {Promise<Object>}
   */
  async getStatus(uid) {
    const status = await kybRepo.findStatusByUid(uid);
    const sections = await kybRepo.findSectionsByUid(uid);

    return {
      kyb: status ? (status.toObject ? status.toObject() : status) : null,
      sections: sections.map((s) => (s.toObject ? s.toObject() : s)),
    };
  }

  /**
   * Get section data
   * @param {string} uid
   * @param {string} sectionKey
   * @param {string} kybId (optional, for validation)
   * @returns {Promise<Object>}
   */
  async getSection(uid, sectionKey, kybId = null) {
    const kybStatus = await kybRepo.findStatusByUid(uid);
    if (!kybStatus) {
      throw new Error('KYB application not found. Please start KYB process first.');
    }

    if (kybId && kybStatus._id.toString() !== kybId) {
      throw new Error('KYB ID mismatch');
    }

    // Check if section is editable
    if (kybStatus.status === 'SUBMITTED' || kybStatus.status === 'UNDER_REVIEW' || kybStatus.status === 'APPROVED') {
      // Only allow editing if ACTION_REQUIRED and this section is flagged
      if (kybStatus.status === 'ACTION_REQUIRED') {
        const section = await kybRepo.findSectionByUidAndKey(uid, sectionKey);
        if (!section || !section.actionRequired) {
          throw new Error('Section is locked and cannot be edited');
        }
      } else {
        throw new Error('KYB application is locked and cannot be edited');
      }
    }

    const section = await kybRepo.findSectionByUidAndKey(uid, sectionKey);
    return {
      section: section ? (section.toObject ? section.toObject() : section) : null,
    };
  }

  /**
   * Get multiple sections by keys (param-based)
   * @param {string} uid
   * @param {string} kybId
   * @param {Array<string>} sectionKeys (optional, if not provided returns all)
   * @returns {Promise<Object>}
   */
  async getSections(uid, kybId, sectionKeys = null) {
    const kybStatus = await kybRepo.findStatusByUid(uid);
    if (!kybStatus) {
      throw new Error('KYB application not found. Please start KYB process first.');
    }

    if (kybStatus._id.toString() !== kybId) {
      throw new Error('KYB ID mismatch');
    }

    // Get all sections
    const allSections = await kybRepo.findSectionsByUid(uid);

    // Filter by keys if provided
    let sections = allSections;
    if (sectionKeys && Array.isArray(sectionKeys) && sectionKeys.length > 0) {
      sections = allSections.filter((s) => sectionKeys.includes(s.sectionKey));
    }

    return {
      sections: sections.map((s) => (s.toObject ? s.toObject() : s)),
    };
  }

  /**
   * Update section data
   * @param {string} uid
   * @param {string} sectionKey
   * @param {Object} sectionData
   * @param {string} kybId (optional, for validation)
   * @returns {Promise<Object>}
   */
  async updateSection(uid, sectionKey, sectionData, kybId = null) {
    const kybStatus = await kybRepo.findStatusByUid(uid);
    if (!kybStatus) {
      throw new Error('KYB application not found. Please start KYB process first.');
    }

    if (kybId && kybStatus._id.toString() !== kybId) {
      throw new Error('KYB ID mismatch');
    }

    // Check if section is editable
    if (kybStatus.status === 'SUBMITTED' || kybStatus.status === 'UNDER_REVIEW' || kybStatus.status === 'APPROVED') {
      if (kybStatus.status === 'ACTION_REQUIRED') {
        const existingSection = await kybRepo.findSectionByUidAndKey(uid, sectionKey);
        if (!existingSection || !existingSection.actionRequired) {
          throw new Error('Section is locked and cannot be edited');
        }
      } else {
        throw new Error('KYB application is locked and cannot be edited');
      }
    }

    // Validate ownership structure totals 100%
    if (sectionKey === 'OWNERSHIP_STRUCTURE' && sectionData.data && sectionData.data.owners) {
      const totalOwnership = sectionData.data.owners.reduce((sum, owner) => sum + (owner.percentage || 0), 0);
      if (Math.abs(totalOwnership - 100) > 0.01) {
        throw new Error('Total ownership percentage must equal 100%');
      }
    }

    const status = sectionData.data ? 'IN_PROGRESS' : 'NOT_STARTED';
    const updateData = {
      data: sectionData.data || {},
      status,
      actionRequired: false,
      actionComments: null,
    };

    // If section has required data, mark as completed
    if (this._isSectionComplete(sectionKey, sectionData.data)) {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    }

    const section = await kybRepo.upsertSection(uid, sectionKey, updateData);

    // Update KYB status to IN_PROGRESS if not already
    if (kybStatus.status === 'NOT_STARTED') {
      await kybRepo.upsertStatus(uid, { status: 'IN_PROGRESS' });
    }

    return {
      section: section.toObject ? section.toObject() : section,
    };
  }

  /**
   * Check if section is complete
   * @param {string} sectionKey
   * @param {Object} data
   * @param {number} documentCount (optional, for document-based sections)
   * @returns {boolean}
   */
  _isSectionComplete(sectionKey, data, documentCount = 0) {
    switch (sectionKey) {
      case 'BUSINESS_PROFILE':
        return !!(data && data.entityType);
      case 'BUSINESS_IDENTITY':
        return !!(data && data.legalName && data.registrationNumber);
      case 'BUSINESS_ADDRESS':
        return !!(data && data.registeredAddress && data.operatingAddress);
      case 'OWNERSHIP_STRUCTURE':
        return !!(data && data.owners && Array.isArray(data.owners) && data.owners.length > 0);
      case 'MANAGEMENT_AUTHORITY':
        return !!(data && data.directors && Array.isArray(data.directors) && data.directors.length > 0);
      case 'STATUTORY_DOCUMENTS':
        // Completion based on document uploads - at least one document required
        return documentCount > 0;
      case 'BANK_ACCOUNT_DECLARATION':
        return !!(data && data.accountNumber && data.bankName && data.accountHolderName);
      case 'BUSINESS_ACTIVITY_DECLARATION':
        return !!(data && data.intendedServices && data.expectedVolume);
      case 'RISK_REGULATORY_DECLARATIONS':
        return !!(data && data.sanctionsCheck !== undefined && data.litigationCheck !== undefined);
      default:
        return false;
    }
  }

  /**
   * Submit KYB application
   * @param {string} uid
   * @param {string} kybId
   * @returns {Promise<Object>}
   */
  async submit(uid, kybId) {
    const kybStatus = await kybRepo.findStatusByUid(uid);
    if (!kybStatus) {
      throw new Error('KYB application not found');
    }

    if (kybStatus._id.toString() !== kybId) {
      throw new Error('KYB ID mismatch');
    }

    // Validate status transition
    this._validateStatusTransition(kybStatus.status, 'SUBMITTED');

    // Get all sections
    const sections = await kybRepo.findSectionsByUid(uid);

    // Validate all required sections are completed
    // For document-based sections, also verify documents exist
    const documentBasedSections = ['STATUTORY_DOCUMENTS'];
    const completedSections = [];
    
    for (const section of sections) {
      if (section.status === 'COMPLETED') {
        completedSections.push(section);
      } else if (documentBasedSections.includes(section.sectionKey)) {
        // For document-based sections, check if documents exist even if status is not COMPLETED
        const docCount = await kybRepo.countDocumentsByUidAndSection(uid, section.sectionKey);
        if (docCount > 0) {
          // Mark section as completed if documents exist
          await kybRepo.upsertSection(uid, section.sectionKey, {
            status: 'COMPLETED',
            completedAt: new Date(),
          });
          completedSections.push({ ...section, status: 'COMPLETED' });
        }
      }
    }

    const completedKeys = completedSections.map((s) => s.sectionKey);
    const missingSections = REQUIRED_SECTIONS.filter((key) => !completedKeys.includes(key));
    
    if (missingSections.length > 0) {
      throw new Error(`Missing required sections: ${missingSections.join(', ')}`);
    }

    // Validate ownership totals 100%
    const ownershipSection = sections.find((s) => s.sectionKey === 'OWNERSHIP_STRUCTURE');
    if (ownershipSection && ownershipSection.data && ownershipSection.data.owners) {
      const totalOwnership = ownershipSection.data.owners.reduce((sum, owner) => sum + (owner.percentage || 0), 0);
      if (Math.abs(totalOwnership - 100) > 0.01) {
        throw new Error('Total ownership percentage must equal 100%');
      }
    }

    // Update status to SUBMITTED
    const updatedStatus = await kybRepo.upsertStatus(uid, { status: 'SUBMITTED' });

    return {
      status: updatedStatus.status,
      submittedAt: updatedStatus.submittedAt,
    };
  }

 /**
 * Upload document
 * @param {string} uid
 * @param {string} sectionKey
 * @param {Object} documentData
 * @param {string} kybId (optional, for validation)
 * @returns {Promise<Object>}
 */
async uploadDocument(uid, sectionKey, documentData, kybId = null) {
  const kybStatus = await kybRepo.findStatusByUid(uid);
  if (!kybStatus) {
    throw new Error('KYB application not found. Please start KYB process first.');
  }

  if (kybId && kybStatus._id.toString() !== kybId) {
    throw new Error('KYB ID mismatch');
  }

  // Check if documents can be uploaded
  if (
    kybStatus.status === 'SUBMITTED' ||
    kybStatus.status === 'UNDER_REVIEW' ||
    kybStatus.status === 'APPROVED'
  ) {
    if (kybStatus.status === 'ACTION_REQUIRED') {
      const section = await kybRepo.findSectionByUidAndKey(uid, sectionKey);
      if (!section || !section.actionRequired) {
        throw new Error('Documents cannot be uploaded for this section');
      }
    } else {
      throw new Error('KYB application is locked. Documents cannot be uploaded.');
    }
  }

  // -------------------------------
  // 1. Create document
  // -------------------------------
  const document = await kybRepo.createDocument({
    uid,
    sectionKey,
    ...documentData,
  });

  // -------------------------------
  // 2. Auto-complete section if documents exist (for document-based sections)
  // -------------------------------
  // Document-based sections: STATUTORY_DOCUMENTS, and potentially others with documents
  const documentBasedSections = ['STATUTORY_DOCUMENTS'];
  
  if (documentBasedSections.includes(sectionKey)) {
    const docCount = await kybRepo.countDocumentsByUidAndSection(uid, sectionKey);
    if (docCount > 0) {
      // Ensure section exists and is marked as COMPLETED
      await kybRepo.upsertSection(uid, sectionKey, {
        status: 'COMPLETED',
        completedAt: new Date(),
        actionRequired: false,
        actionComments: null,
        data: {}, // Empty data for document-based sections
      });
    }
  }

  return {
    document: document.toObject ? document.toObject() : document,
  };
}


  /**
   * Get documents
   * @param {string} uid
   * @param {string} sectionKey (optional)
   * @param {string} kybId (optional, for validation)
   * @returns {Promise<Object>}
   */
  async getDocuments(uid, sectionKey = null, kybId = null) {
    if (kybId) {
      const kybStatus = await kybRepo.findStatusByUid(uid);
      if (!kybStatus) {
        throw new Error('KYB application not found');
      }
      if (kybStatus._id.toString() !== kybId) {
        throw new Error('KYB ID mismatch');
      }
    }

    const documents = await kybRepo.findDocumentsByUid(uid, sectionKey);
    return {
      documents: documents.map((d) => (d.toObject ? d.toObject() : d)),
    };
  }

  /**
   * Unified admin review API
   * @param {string} uid
   * @param {string} kybId
   * @param {Object} reviewData
   * @returns {Promise<Object>}
   */
  async review(uid, kybId, reviewData) {
    const kybStatus = await kybRepo.findStatusByUid(uid);
    if (!kybStatus) {
      throw new Error('KYB application not found');
    }

    if (kybStatus._id.toString() !== kybId) {
      throw new Error('KYB ID mismatch');
    }

    const { action, reviewedBy, comments } = reviewData;

    // Validate action
    if (!['APPROVE', 'REJECT', 'ACTION_REQUIRED'].includes(action)) {
      throw new Error('Invalid action. Must be APPROVE, REJECT, or ACTION_REQUIRED');
    }

    // Validate status - all actions require UNDER_REVIEW status
    if (kybStatus.status !== 'UNDER_REVIEW') {
      throw new Error(`KYB must be in UNDER_REVIEW status to perform ${action} action. Current status: ${kybStatus.status}`);
    }

    // Route to appropriate action handler
    switch (action) {
      case 'APPROVE':
        return this._handleApprove(uid, kybId, { validityPeriod: reviewData.validityPeriod, reviewedBy, reviewComments: comments });
      case 'REJECT':
        return this._handleReject(uid, kybId, { rejectionReason: reviewData.rejectionReason, rejectionCategory: reviewData.rejectionCategory, reviewedBy, reviewComments: comments });
      case 'ACTION_REQUIRED':
        return this._handleActionRequired(uid, kybId, { sectionKey: reviewData.sectionKey, actionComments: comments, reviewedBy });
      default:
        throw new Error('Invalid action');
    }
  }

  /**
   * Handle approve action (internal)
   * @param {string} uid
   * @param {string} kybId
   * @param {Object} approvalData
   * @returns {Promise<Object>}
   */
  async _handleApprove(uid, kybId, approvalData) {
    this._validateStatusTransition('UNDER_REVIEW', 'APPROVED');

    const { validityPeriod, reviewedBy, reviewComments } = approvalData;
    const validityDays = validityPeriod || 365; // Default 1 year
    const validityExpiresAt = new Date();
    validityExpiresAt.setDate(validityExpiresAt.getDate() + validityDays);

    const updatedStatus = await kybRepo.upsertStatus(uid, {
      status: 'APPROVED',
      validityPeriod: validityDays,
      validityExpiresAt,
      reviewedBy: reviewedBy || null,
      reviewComments: reviewComments || null,
    });

    return {
      status: updatedStatus.status,
      approvedAt: updatedStatus.approvedAt,
      validityExpiresAt: updatedStatus.validityExpiresAt,
    };
  }

  /**
   * Handle reject action (internal)
   * @param {string} uid
   * @param {string} kybId
   * @param {Object} rejectionData
   * @returns {Promise<Object>}
   */
  async _handleReject(uid, kybId, rejectionData) {
    this._validateStatusTransition('UNDER_REVIEW', 'REJECTED');

    const { rejectionReason, rejectionCategory, reviewedBy, reviewComments } = rejectionData;

    if (!rejectionReason) {
      throw new Error('Rejection reason is required');
    }

    const updatedStatus = await kybRepo.upsertStatus(uid, {
      status: 'REJECTED',
      rejectionReason,
      rejectionCategory: rejectionCategory || null,
      reviewedBy: reviewedBy || null,
      reviewComments: reviewComments || null,
    });

    return {
      status: updatedStatus.status,
      rejectedAt: updatedStatus.rejectedAt,
      rejectionReason: updatedStatus.rejectionReason,
    };
  }

  /**
   * Handle action required (internal)
   * @param {string} uid
   * @param {string} kybId
   * @param {Object} actionData
   * @returns {Promise<Object>}
   */
  async _handleActionRequired(uid, kybId, actionData) {
    this._validateStatusTransition('UNDER_REVIEW', 'ACTION_REQUIRED');

    const { sectionKey, actionComments, reviewedBy } = actionData;

    if (!sectionKey) {
      throw new Error('Section key is required');
    }

    // Update section to mark action required
    await kybRepo.upsertSection(uid, sectionKey, {
      actionRequired: true,
      actionComments: actionComments || null,
    });

    // Update KYB status
    const updatedStatus = await kybRepo.upsertStatus(uid, {
      status: 'ACTION_REQUIRED',
      reviewedBy: reviewedBy || null,
      reviewComments: actionComments || null,
    });

    return {
      status: updatedStatus.status,
      sectionKey,
      actionComments,
    };
  }

  /**
   * Approve KYB (admin/compliance action) - backward compatibility
   * @param {string} uid
   * @param {string} kybId
   * @param {Object} approvalData
   * @returns {Promise<Object>}
   */
  async approve(uid, kybId, approvalData) {
    return this.review(uid, kybId, {
      action: 'APPROVE',
      reviewedBy: approvalData.reviewedBy,
      comments: approvalData.reviewComments,
      validityPeriod: approvalData.validityPeriod,
    });
  }

  /**
   * Reject KYB (admin/compliance action) - backward compatibility
   * @param {string} uid
   * @param {string} kybId
   * @param {Object} rejectionData
   * @returns {Promise<Object>}
   */
  async reject(uid, kybId, rejectionData) {
    return this.review(uid, kybId, {
      action: 'REJECT',
      reviewedBy: rejectionData.reviewedBy,
      comments: rejectionData.reviewComments,
      rejectionReason: rejectionData.rejectionReason,
      rejectionCategory: rejectionData.rejectionCategory,
    });
  }

  /**
   * Mark action required (admin/compliance action) - backward compatibility
   * @param {string} uid
   * @param {string} kybId
   * @param {Object} actionData
   * @returns {Promise<Object>}
   */
  async markActionRequired(uid, kybId, actionData) {
    return this.review(uid, kybId, {
      action: 'ACTION_REQUIRED',
      reviewedBy: actionData.reviewedBy,
      comments: actionData.actionComments,
      sectionKey: actionData.sectionKey,
    });
  }

  /**
   * Check if KYB is approved
   * @param {string} uid
   * @returns {Promise<boolean>}
   */
  async isApproved(uid) {
    const kybStatus = await kybRepo.findStatusByUid(uid);
    if (!kybStatus) {
      return false;
    }

    if (kybStatus.status !== 'APPROVED') {
      return false;
    }

    // Check validity period
    if (kybStatus.validityExpiresAt && new Date() > kybStatus.validityExpiresAt) {
      return false;
    }

    return true;
  }
}

module.exports = new KybService();


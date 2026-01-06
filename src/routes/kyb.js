const express = require('express');
const { kybController } = require('../controllers');
const { verifyFirebaseToken, requireRole } = require('../middlewares');
const { validate } = require('../utils');
const {
  updateSectionSchema,
  uploadDocumentSchema,
  approveSchema,
  rejectSchema,
  actionRequiredSchema,
  reviewSchema,
} = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

// KYB lifecycle routes
router.post('/start', kybController.start.bind(kybController));
router.get('/status', kybController.getStatus.bind(kybController));

// Section-based routes
router.get('/:kybId/section/:sectionKey', kybController.getSection.bind(kybController));
router.get('/:kybId/sections', kybController.getSections.bind(kybController));
router.put('/:kybId/section/:sectionKey', validate(updateSectionSchema), kybController.updateSection.bind(kybController));

// Submission route
router.post('/:kybId/submit', kybController.submit.bind(kybController));

// Document routes
router.post('/:kybId/documents', validate(uploadDocumentSchema), kybController.uploadDocument.bind(kybController));
router.get('/:kybId/documents', kybController.getDocuments.bind(kybController));

// Compliance routes (require admin role)
// Unified review API
router.post('/:uid/:kybId/review', requireRole(['admin']), validate(reviewSchema), kybController.review.bind(kybController));
// Backward compatibility - existing admin APIs
router.post('/:uid/:kybId/approve', requireRole(['admin']), validate(approveSchema), kybController.approve.bind(kybController));
router.post('/:uid/:kybId/reject', requireRole(['admin']), validate(rejectSchema), kybController.reject.bind(kybController));
router.post('/:uid/:kybId/action-required', requireRole(['admin']), validate(actionRequiredSchema), kybController.markActionRequired.bind(kybController));

module.exports = router;


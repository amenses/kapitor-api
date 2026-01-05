const Joi = require('joi');

const sectionKeySchema = Joi.string()
  .valid(
    'BUSINESS_PROFILE',
    'BUSINESS_IDENTITY',
    'BUSINESS_ADDRESS',
    'OWNERSHIP_STRUCTURE',
    'MANAGEMENT_AUTHORITY',
    'STATUTORY_DOCUMENTS',
    'BANK_ACCOUNT_DECLARATION',
    'BUSINESS_ACTIVITY_DECLARATION',
    'RISK_REGULATORY_DECLARATIONS'
  )
  .required();

const updateSectionSchema = Joi.object({
  data: Joi.object().unknown(true).required(),
});

const submitSchema = Joi.object({
  kybId: Joi.string().required(),
}).unknown(false);

const uploadDocumentSchema = Joi.object({
  sectionKey: sectionKeySchema,
  documentType: Joi.string().required().trim(),
  documentName: Joi.string().required().trim(),
  fileUrl: Joi.string().uri().required().trim(),
  fileSize: Joi.number().integer().min(0).optional(),
  mimeType: Joi.string().trim().optional(),
  expiryDate: Joi.date().optional(),
  ocrMetadata: Joi.object().unknown(true).optional(),
});

const approveSchema = Joi.object({
  validityPeriod: Joi.number().integer().min(1).max(3650).optional(), // 1 day to 10 years
  reviewedBy: Joi.string().trim().optional(),
  reviewComments: Joi.string().trim().optional(),
});

const rejectSchema = Joi.object({
  rejectionReason: Joi.string().required().trim(),
  rejectionCategory: Joi.string().trim().optional(),
  reviewedBy: Joi.string().trim().optional(),
  reviewComments: Joi.string().trim().optional(),
});

const actionRequiredSchema = Joi.object({
  sectionKey: sectionKeySchema,
  actionComments: Joi.string().required().trim(),
  reviewedBy: Joi.string().trim().optional(),
});

const reviewSchema = Joi.object({
  action: Joi.string().valid('APPROVE', 'REJECT', 'ACTION_REQUIRED').required(),
  reviewedBy: Joi.string().trim().optional(),
  comments: Joi.string().trim().optional(),
  // Only for APPROVE
  validityPeriod: Joi.when('action', {
    is: 'APPROVE',
    then: Joi.number().integer().min(1).max(3650).optional(),
    otherwise: Joi.forbidden(),
  }),
  // Only for REJECT
  rejectionReason: Joi.when('action', {
    is: 'REJECT',
    then: Joi.string().required().trim(),
    otherwise: Joi.forbidden(),
  }),
  rejectionCategory: Joi.when('action', {
    is: 'REJECT',
    then: Joi.string().trim().optional(),
    otherwise: Joi.forbidden(),
  }),
  // Only for ACTION_REQUIRED
  sectionKey: Joi.when('action', {
    is: 'ACTION_REQUIRED',
    then: sectionKeySchema,
    otherwise: Joi.forbidden(),
  }),
});

module.exports = {
  updateSectionSchema,
  submitSchema,
  uploadDocumentSchema,
  approveSchema,
  rejectSchema,
  actionRequiredSchema,
  reviewSchema,
};


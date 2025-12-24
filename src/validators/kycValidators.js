const Joi = require('joi');

const kycUpdateSchema = Joi.object({
  aadhaarFrontUrl: Joi.string().uri().optional(),
  aadhaarBackUrl: Joi.string().uri().optional(),
  panUrl: Joi.string().uri().optional(),
  selfieUrl: Joi.string().uri().optional(),
  status: Joi.string()
    .valid('in_progress', 'submitted', 'verified', 'rejected')
    .optional(),
});

const digilockerCallbackSchema = Joi.object({
  code: Joi.string().required(),
  state: Joi.string().optional(),
});

module.exports = {
  kycUpdateSchema,
  digilockerCallbackSchema,
};


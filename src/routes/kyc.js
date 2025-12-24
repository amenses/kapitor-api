const express = require('express');
const { kycController } = require('../controllers');
const { verifyFirebaseToken } = require('../middlewares');
const { validate } = require('../utils');
const { kycUpdateSchema, digilockerCallbackSchema } = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

// GET /kyc/status
router.get('/status', kycController.getStatus.bind(kycController));

// POST /kyc
router.post('/', validate(kycUpdateSchema), kycController.update.bind(kycController));

// GET /kyc/digilocker/authorize
router.get('/digilocker/authorize', kycController.getDigilockerAuthUrl.bind(kycController));

// POST /kyc/digilocker/callback
router.post('/digilocker/callback', validate(digilockerCallbackSchema), kycController.digilockerCallback.bind(kycController));

// GET /kyc/digilocker/documents
router.get('/digilocker/documents', kycController.getDigilockerDocuments.bind(kycController));

module.exports = router;

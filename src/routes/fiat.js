const express = require('express');
const { fiatController } = require('../controllers');
const { verifyFirebaseToken } = require('../middlewares');
const { validate } = require('../utils');
const { linkBankAccountSchema, depositIntentSchema } = require('../validators');

const router = express.Router();

// Webhook endpoint (no auth, signature handled in controller/service)
router.post('/webhook/cashfree', fiatController.handleCashfreeWebhook.bind(fiatController));

// Authenticated routes
router.use(verifyFirebaseToken);

router.post(
  '/account',
  validate(linkBankAccountSchema),
  fiatController.linkAccount.bind(fiatController)
);

router.get('/account', fiatController.getAccount.bind(fiatController));

router.post(
  '/deposits',
  validate(depositIntentSchema),
  fiatController.createDepositIntent.bind(fiatController)
);

module.exports = router;

const express = require('express');
const { walletController } = require('../controllers');
const { verifyFirebaseToken } = require('../middlewares');
const { validate } = require('../utils');
const { createWalletSchema, confirmMnemonicSchema, unlockSchema } = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

// POST /wallet/create
router.post('/create', validate(createWalletSchema), walletController.create.bind(walletController));

// POST /wallet/confirm-mnemonic
router.post('/confirm-mnemonic', validate(confirmMnemonicSchema), walletController.confirmMnemonic.bind(walletController));

// POST /wallet/unlock
router.post('/unlock', validate(unlockSchema), walletController.unlock.bind(walletController));

module.exports = router;

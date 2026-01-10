const express = require('express');
const { walletController } = require('../controllers');
const { verifyFirebaseToken } = require('../middlewares');
const { validate } = require('../utils');
const {
    createWalletSchema,
    confirmMnemonicSchema,
    unlockSchema,
    sendCryptoSchema,
} = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

// POST /wallet/create
router.post(
    '/create',
    validate(createWalletSchema),
    walletController.create.bind(walletController)
);

// POST /wallet/confirm-mnemonic
router.post(
    '/confirm-mnemonic',
    validate(confirmMnemonicSchema),
    walletController.confirmMnemonic.bind(walletController)
);

// POST /wallet/unlock
router.post(
    '/unlock',
    validate(unlockSchema),
    walletController.unlock.bind(walletController)
);

// GET /wallet/balance
router.get(
    '/balance',
    walletController.getBalance.bind(walletController)
);

// POST /wallet/send
router.post(
    '/send',
    validate(sendCryptoSchema),
    walletController.sendCrypto.bind(walletController)
);

// GET /wallet/receive
router.get(
    '/receive',
    walletController.receiveCrypto.bind(walletController)
);

// GET /wallet/check-ept-eligibility
router.get(
    '/check-ept-eligibility',
    walletController.checkEPTEligibility.bind(walletController)
);

module.exports = router;

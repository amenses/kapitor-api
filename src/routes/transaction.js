const express = require('express');
const { transactionController } = require('../controllers');
const { verifyFirebaseToken } = require('../middlewares');

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

// GET /transactions
router.get('/', transactionController.getUserTransactions.bind(transactionController));

// GET /transactions/:transactionId
router.get('/:transactionId', transactionController.getTransactionById.bind(transactionController));

// GET /transactions/hash/:txHash
router.get('/hash/:txHash', transactionController.getTransactionByHash.bind(transactionController));

module.exports = router;

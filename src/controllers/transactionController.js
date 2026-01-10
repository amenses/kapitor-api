const { transactionService } = require('../services');
const { sendSuccess } = require('../utils/response');

class TransactionController {
    /**
     * Get paginated transactions for logged-in user
     * GET /transactions
     */
    async getUserTransactions(req, res, next) {
        try {
            const { uid } = req.user;
            const query = req.query;

            const result = await transactionService.getUserTransactions(uid, query);

            sendSuccess(res, result, 200);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get transaction by database ID
     * GET /transactions/:transactionId
     */
    async getTransactionById(req, res, next) {
        try {
            const { uid } = req.user;
            const { transactionId } = req.params;

            const transaction = await transactionService.getTransactionById(
                uid,
                transactionId
            );

            sendSuccess(res, { transaction }, 200);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get transaction by blockchain hash
     * GET /transactions/hash/:txHash
     */
    async getTransactionByHash(req, res, next) {
        try {
            const { uid } = req.user;
            const { txHash } = req.params;
            const { chain } = req.query;

            const transaction = await transactionService.getTransactionByHash(
                uid,
                txHash,
                chain
            );

            sendSuccess(res, { transaction }, 200);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TransactionController();

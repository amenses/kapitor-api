const { transactionRepo } = require('../../repos');

class TransactionService {
    /**
     * Get paginated transactions for a user
     * @param {string} uid
     * @param {Object} query
     * @returns {Promise<Object>}
     */
    async getUserTransactions(uid, query = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',

            // filters
            chain,
            network,
            status,
            direction,
            assetType,
            symbol,
            txType,
            fromDate,
            toDate,
        } = query;

        const filter = { uid };

        if (chain) filter.chain = chain;
        if (network) filter.network = network;
        if (status) filter.status = status;
        if (direction) filter.direction = direction;
        if (assetType) filter.assetType = assetType;
        if (symbol) filter.symbol = symbol;
        if (txType) filter.type = txType;

        // Date range filter
        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        const sort = {
            [sortBy]: sortOrder === 'asc' ? 1 : -1,
        };

        const result = await transactionRepo.paginate(filter, {
            page,
            limit,
            sort,
        });

        return {
            data: result.docs,
            pagination: {
                page: result.page,
                limit: result.limit,
                totalDocs: result.totalDocs,
                totalPages: result.totalPages,
                hasNextPage: result.hasNextPage,
                hasPrevPage: result.hasPrevPage,
            },
        };
    }

    /**
     * Get single transaction by DB id
     * @param {string} uid
     * @param {string} transactionId
     * @returns {Promise<Object>}
     */
    async getTransactionById(uid, transactionId) {
        const tx = await transactionRepo.findOne({
            _id: transactionId,
            uid,
        });

        if (!tx) {
            throw new Error('Transaction not found');
        }

        return tx.toObject ? tx.toObject() : tx;
    }

    /**
     * Get transaction by hash (chain-aware)
     * @param {string} uid
     * @param {string} txHash
     * @param {string} chain
     * @returns {Promise<Object>}
     */
    async getTransactionByHash(uid, txHash, chain) {
        const filter = { uid, txHash };
        if (chain) filter.chain = chain;

        const tx = await transactionRepo.findOne(filter);

        if (!tx) {
            throw new Error('Transaction not found');
        }

        return tx.toObject ? tx.toObject() : tx;
    }
}

module.exports = new TransactionService();

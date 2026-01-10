const { Transaction } = require('../models');

class TransactionRepository {
    /**
     * Create a transaction record
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {
        return Transaction.create(data);
    }

    /**
     * Find transaction by filter
     * @param {Object} filter
     * @returns {Promise<Object|null>}
     */
    async findOne(filter) {
        return Transaction.findOne(filter);
    }

    /**
     * Get paginated transactions
     * @param {Object} filter
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async paginate(filter, options) {
        return Transaction.paginate(filter, options);
    }

    /**
     * Update transaction by txHash
     * @param {string} txHash
     * @param {Object} update
     * @returns {Promise<Object|null>}
     */
    async updateByHash(txHash, update) {
        return Transaction.findOneAndUpdate(
            { txHash },
            update,
            { new: true }
        );
    }
}

module.exports = new TransactionRepository();

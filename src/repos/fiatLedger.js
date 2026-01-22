const { FiatLedger } = require('../models');

class FiatLedgerRepository {
  createEntry(data) {
    return FiatLedger.create(data);
  }

  findByGatewayPaymentId(gatewayPaymentId) {
    return FiatLedger.findOne({ gatewayPaymentId });
  }

  updateStatus(id, status, extra = {}) {
    return FiatLedger.findByIdAndUpdate(
      id,
      { status, ...extra },
      { new: true }
    );
  }

  async getBalanceSummary(uid) {
    const rows = await FiatLedger.aggregate([
      {
        $match: {
          uid,
          status: { $in: ['credited', 'settled'] },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const summary = rows.reduce(
      (acc, row) => {
        acc[row._id] = row.total;
        return acc;
      },
      {}
    );

    const credit = summary.credit || 0;
    const debit = summary.debit || 0;

    return {
      credit,
      debit,
      available: credit - debit,
    };
  }
}

module.exports = new FiatLedgerRepository();

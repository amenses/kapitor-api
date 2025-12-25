const DepositRequest = require("../models/DepositRequest");

class DepositRequestRepository {
  create(data) {
    return DepositRequest.create(data);
  }

  findById(id) {
    return DepositRequest.findById(id);
  }

  findByTxHash(txHash) {
    return DepositRequest.findOne({ txHash });
  }

  findPendingByWallet(walletAddress) {
    return DepositRequest.find({
      walletAddress,
      status: { $in: ["waiting", "pending_confirmation"] },
    });
  }

  updateById(id, update) {
    return DepositRequest.findByIdAndUpdate(id, update, { new: true });
  }

  setTxInfo(id, { txHash, amount }) {
    return DepositRequest.findByIdAndUpdate(
      id,
      {
        txHash,
        actualAmount: amount,
        status: "pending_confirmation",
        receivedAt: new Date(),
      },
      { new: true }
    );
  }

  markConfirmed(id, confirmations = 6) {
    return DepositRequest.findByIdAndUpdate(
      id,
      { status: "confirmed", confirmations },
      { new: true }
    );
  }

  createManualCredit(data) {
    return DepositRequest.create({
      ...data,
      status: "manual",
      type: "manual",
      actualAmount: data.actualAmount,
      receivedAt: new Date(),
    });
  }


  updateConfirmations(txHash, confirmations) {
  return DepositRequest.findOneAndUpdate(
    { txHash },
    { confirmations },
    { new: true }
  );
}
}

module.exports = new DepositRequestRepository();

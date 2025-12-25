const depositRepo = require("../../repos/depositRequest");

class DepositRequestService {
  async createUserRequest({ userId, walletAddress, expectedAmount }) {
    return depositRepo.create({
      userId,
      walletAddress,
      expectedAmount,
      status: "waiting",
      type: "request",
    });
  }

  async recordBlockchainDeposit({ uid,walletAddress, txHash, amount }) {
    // Check if already processed
    const existing = await depositRepo.findByTxHash(txHash);
    if (existing) return existing;

    // Find open requests for this wallet
   // const pending = await depositRepo.findPendingByWallet(walletAddress);

    // If user has an open request → attach tx
    // if (pending.length) {
    //   return depositRepo.setTxInfo(pending[0]._id, {
    //     txHash,
    //     amount,
    //   });
    // }

    // No request existed — still record deposit
    return depositRepo.create({
      userId: uid,
      walletAddress,
      actualAmount: amount,
      txHash,
      status: "pending_confirmation",
      type: "request",
      receivedAt: new Date(),
    });
  }

  async confirmDeposit(id, confirmations) {
    return depositRepo.markConfirmed(id, confirmations);
  }

  async manualCredit({ userId, walletAddress, amount, adminId }) {
    return depositRepo.createManualCredit({
      userId,
      walletAddress,
      actualAmount: amount,
      addedBy: adminId,
    });
  }

  async updateConfirmations(txHash, confirmations) {
  return depositRepo.updateConfirmations(txHash, confirmations);
}

}

module.exports = new DepositRequestService();

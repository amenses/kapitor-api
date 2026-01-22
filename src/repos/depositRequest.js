const DepositRequest = require('../models/DepositRequest');

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

  findByGatewayPaymentId(gatewayPaymentId) {
    return DepositRequest.findOne({ gatewayPaymentId });
  }

  findPendingByWallet(walletAddress) {
    return DepositRequest.find({
      walletAddress,
      status: { $in: ['waiting', 'pending_confirmation'] },
    });
  }

  findLatestByVirtualAccountId(virtualAccountId) {
    return DepositRequest.findOne({
      virtualAccountId,
    }).sort({ createdAt: -1 });
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
        status: 'pending_confirmation',
        receivedAt: new Date(),
      },
      { new: true }
    );
  }

  markConfirmed(id, confirmations = 6) {
    return DepositRequest.findByIdAndUpdate(
      id,
      { status: 'confirmed', confirmations },
      { new: true }
    );
  }

  createManualCredit(data) {
    return DepositRequest.create({
      ...data,
      status: 'manual',
      type: 'manual',
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

  createFiatIntent(data) {
    return DepositRequest.create({
      ...data,
      type: 'request',
      status: 'waiting',
      requestedAt: new Date(),
    });
  }

  markFiatStatus(id, fiatStatus, extra = {}) {
    return DepositRequest.findByIdAndUpdate(
      id,
      { fiatStatus, ...extra },
      { new: true }
    );
  }

  attachGatewayInfo(id, payload) {
    return DepositRequest.findByIdAndUpdate(
      id,
      {
        gatewayPaymentId: payload.gatewayPaymentId,
        gatewayReferenceId: payload.gatewayReferenceId,
        fiatAmount: payload.amount,
        fiatCurrency: payload.currency || 'INR',
        virtualAccountId: payload.virtualAccountId,
        virtualUpiId: payload.virtualUpiId,
        fiatStatus: payload.fiatStatus || 'pending',
        receivedAt: payload.receivedAt || new Date(),
      },
      { new: true }
    );
  }

  findFiatPendingByUid(uid) {
    return DepositRequest.find({
      userId: uid,
      fiatStatus: { $in: ['initiated', 'pending', 'credited'] },
    });
  }
}

module.exports = new DepositRequestRepository();

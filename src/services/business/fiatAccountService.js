const { fiatAccountRepo, walletDetailsRepo } = require('../../repos');
const { paymentGatewayService } = require('../external');

class FiatAccountService {
  async linkAccount(uid, payload) {
    if (!uid) throw new Error('uid is required');
    const wallet = await walletDetailsRepo.findByUid(uid);
    if (!wallet) {
      throw new Error('Wallet not found. Create a wallet before linking bank account.');
    }

    const gatewayCustomerId =
      payload.gatewayCustomerId ||
      `${process.env.CASHFREE_VA_PREFIX || 'KAPITOR'}_${uid}`;

    let account = await fiatAccountRepo.findByUid(uid);
    let virtualAccount = null;

    if (!account || !account.virtualAccountId) {
      virtualAccount = await paymentGatewayService.createVirtualAccount({
        customerId: gatewayCustomerId,
        customerName: payload.accountHolder,
        email: payload.email,
        phone: payload.phone,
      });
    }

    const update = {
      uid,
      walletAddress: wallet.walletAddress,
      accountHolder: payload.accountHolder,
      bankAccountNumber: payload.bankAccountNumber,
      ifsc: payload.ifsc,
      bankName: payload.bankName,
      status: 'pending',
      gatewayCustomerId,
    };

    if (virtualAccount) {
      update.virtualAccountId = virtualAccount.id;
      update.virtualAccountNumber = virtualAccount.accountNumber;
      update.virtualIfsc = virtualAccount.ifsc;
      update.virtualUpiId = virtualAccount.upiId;
      update.metadata = { bankName: virtualAccount.bankName, raw: virtualAccount.raw };
    }

    account = await fiatAccountRepo.upsertByUid(uid, update);

    return this._format(account);
  }

  async getAccount(uid) {
    const account = await fiatAccountRepo.findByUid(uid);
    if (!account) {
      throw new Error('Fiat account not linked yet');
    }
    return this._format(account);
  }

  async findByVirtualAccountId(virtualAccountId) {
    return fiatAccountRepo.findByVirtualAccountId(virtualAccountId);
  }

  _format(account) {
    if (!account) return null;
    return {
      uid: account.uid,
      walletAddress: account.walletAddress,
      accountHolder: account.accountHolder,
      bankAccountNumber: account.bankAccountNumber,
      ifsc: account.ifsc,
      bankName: account.bankName,
      status: account.status,
      verificationStatus: account.verificationStatus,
      virtualAccount: {
        id: account.virtualAccountId,
        accountNumber: account.virtualAccountNumber,
        ifsc: account.virtualIfsc,
        upiId: account.virtualUpiId,
      },
      metadata: account.metadata || {},
      updatedAt: account.updatedAt,
    };
  }
}

module.exports = new FiatAccountService();

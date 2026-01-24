const { fiatAccountRepo, walletDetailsRepo } = require('../../repos');

class FiatAccountService {
  async linkAccount(uid, payload) {
    if (!uid) throw new Error('uid is required');
    const wallet = await walletDetailsRepo.findByUid(uid);
    if (!wallet) {
      throw new Error('Wallet not found. Create a wallet before linking bank account.');
    }

    const gatewayCustomerId = payload.gatewayCustomerId || `${process.env.STRIPE_CUSTOMER_PREFIX || 'KAPITOR'}_${uid}`;

    const update = {
      uid,
      walletAddress: wallet.walletAddress,
      accountHolder: payload.accountHolder,
      bankAccountNumber: payload.bankAccountNumber,
      ifsc: payload.ifsc,
      bankName: payload.bankName,
      status: 'pending',
      gatewayCustomerId,
      metadata: {
        email: payload.email,
        phone: payload.phone,
      },
    };

    const account = await fiatAccountRepo.upsertByUid(uid, update);

    return this._format(account);
  }

  async getAccount(uid) {
    const account = await fiatAccountRepo.findByUid(uid);
    if (!account) {
      throw new Error('Fiat account not linked yet');
    }
    return this._format(account);
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
      metadata: account.metadata || {},
      updatedAt: account.updatedAt,
    };
  }
}

module.exports = new FiatAccountService();

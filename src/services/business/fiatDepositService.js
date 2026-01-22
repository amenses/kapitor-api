const {
  depositRequestRepo,
  fiatLedgerRepo,
  fiatAccountRepo,
  walletDetailsRepo,
  transactionRepo,
} = require('../../repos');
const { paymentGatewayService } = require('../external');
const kapitorTokenService = require('./kapitorTokenService');

class FiatDepositService {
  async createDepositIntent(uid, payload = {}) {
    const amount = Number(payload.amount);
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const account = await fiatAccountRepo.findByUid(uid);
    if (!account) {
      throw new Error('Link a bank account before creating a deposit intent');
    }

    const deposit = await depositRequestRepo.createFiatIntent({
      userId: uid,
      walletAddress: account.walletAddress,
      expectedAmount: amount,
      fiatAmount: amount,
      fiatCurrency: payload.currency || 'INR',
      fiatStatus: 'initiated',
      virtualAccountId: account.virtualAccountId,
      virtualUpiId: account.virtualUpiId,
    });

    return {
      intentId: deposit._id,
      amount,
      currency: deposit.fiatCurrency,
      instructions: {
        accountHolder: account.accountHolder,
        bankAccountNumber: account.virtualAccountNumber || account.bankAccountNumber,
        ifsc: account.virtualIfsc || account.ifsc,
        bankName: account.bankName || 'Cashfree Partner Bank',
        upiId: account.virtualUpiId,
        reference: payload.reference || deposit._id.toString(),
      },
    };
  }

  async handleGatewayWebhook(rawBody, headers = {}) {
    const signature = headers['x-webhook-signature'] || headers['x-signature'];
    if (!paymentGatewayService.verifyWebhookSignature(rawBody, signature)) {
      throw new Error('Invalid Cashfree webhook signature');
    }

    const payload = JSON.parse(rawBody.toString('utf8') || '{}');
    const event = paymentGatewayService.parseDepositPayload(payload);
    if (!event || !event.virtualAccountId) {
      throw new Error('Unsupported webhook payload');
    }

    if (!['SUCCESS', 'VA_CREDIT', 'COMPLETED'].includes(event.status)) {
      return { ignored: true, reason: `Status ${event.status}` };
    }

    const account = await fiatAccountRepo.findByVirtualAccountId(event.virtualAccountId);
    if (!account) {
      throw new Error(`No fiat account mapped for virtual account ${event.virtualAccountId}`);
    }

    let deposit =
      (event.gatewayPaymentId && (await depositRequestRepo.findByGatewayPaymentId(event.gatewayPaymentId))) ||
      (await depositRequestRepo.findLatestByVirtualAccountId(event.virtualAccountId));

    if (!deposit) {
      deposit = await depositRequestRepo.createFiatIntent({
        userId: account.uid,
        walletAddress: account.walletAddress,
        expectedAmount: event.amount,
        fiatAmount: event.amount,
        fiatCurrency: event.currency,
        fiatStatus: 'pending',
        virtualAccountId: event.virtualAccountId,
        virtualUpiId: account.virtualUpiId,
      });
    }

    deposit = await depositRequestRepo.attachGatewayInfo(deposit._id, {
      gatewayPaymentId: event.gatewayPaymentId,
      gatewayReferenceId: event.referenceId,
      amount: event.amount,
      currency: event.currency,
      virtualAccountId: event.virtualAccountId,
      virtualUpiId: account.virtualUpiId,
      fiatStatus: 'credited',
      receivedAt: event.occurredAt,
    });

    const existingLedger = event.gatewayPaymentId
      ? await fiatLedgerRepo.findByGatewayPaymentId(event.gatewayPaymentId)
      : null;
    if (existingLedger && existingLedger.status === 'settled') {
      return { alreadyProcessed: true };
    }

    const ledgerEntry = existingLedger
      ? existingLedger
      : await fiatLedgerRepo.createEntry({
          uid: account.uid,
          type: 'credit',
          source: 'deposit',
          amount: event.amount,
          currency: event.currency,
          status: 'credited',
          gatewayPaymentId: event.gatewayPaymentId,
          referenceId: event.referenceId,
          metadata: event.raw,
          occurredAt: event.occurredAt,
        });

    const wallet = await walletDetailsRepo.findByUid(account.uid);
    if (!wallet) {
      throw new Error('Wallet not found for user');
    }

    const mintResult = await kapitorTokenService.mintTo(wallet.walletAddress, event.amount);
    await fiatLedgerRepo.updateStatus(ledgerEntry._id, 'settled', {
      notes: 'KPT minted',
    });
    await depositRequestRepo.markFiatStatus(deposit._id, 'minted', {
      actualAmount: event.amount,
      status: 'confirmed',
    });

    await transactionRepo.create({
      uid: account.uid,
      chain: 'ethereum',
      network: process.env.ETH_NETWORK || 'mainnet',
      txHash: mintResult.txHash,
      fromAddress: 'Kapitor Treasury',
      toAddress: wallet.walletAddress,
      assetType: 'token',
      tokenAddress: process.env.KPT_TOKEN_ADDRESS,
      symbol: 'KPT',
      decimals: kapitorTokenService.decimals,
      amount: String(event.amount),
      direction: 'in',
      type: 'transfer',
      status: mintResult.mock ? 'confirmed' : 'pending',
      context: 'fiat_deposit',
      rawTx: mintResult,
    });

    return {
      status: 'processed',
      depositId: deposit._id,
      ledgerId: ledgerEntry._id,
    };
  }
}

module.exports = new FiatDepositService();

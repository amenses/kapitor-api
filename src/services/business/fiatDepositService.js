const {
  depositRequestRepo,
  fiatLedgerRepo,
  fiatAccountRepo,
  walletDetailsRepo,
  transactionRepo,
} = require('../../repos');
const { paymentGatewayService } = require('../external');
const kapitorTokenService = require('./kapitorTokenService');
const stripe = require("stripe")
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
      fiatCurrency: (payload.currency || process.env.STRIPE_DEFAULT_CURRENCY || 'USD').toUpperCase(),
      fiatStatus: 'initiated',
    });

    const paymentIntent = await paymentGatewayService.createPaymentIntent({
      amount,
      currency: deposit.fiatCurrency,
      customerEmail: payload.email || account?.metadata?.email,
      description: `Kapitor fiat deposit ${deposit._id}`,
      metadata: {
        depositId: deposit._id.toString(),
        uid,
      },
    });

    await depositRequestRepo.attachGatewayInfo(deposit._id, {
      gatewayPaymentId: paymentIntent.id,
      amount,
      currency: deposit.fiatCurrency,
      fiatStatus: 'pending',
      clientSecret: paymentIntent.client_secret,
      customerId: paymentIntent.customer,
    });

    return {
      depositId: deposit._id,
      amount,
      currency: deposit.fiatCurrency,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      publishableKey: paymentGatewayService.publishableKey,
      status: 'pending',
    };
  }

  async handleGatewayWebhook(rawBody, headers = {}) {
    const signature =
      headers['stripe-signature'] || headers['Stripe-Signature'] || headers['stripe_signature'];

    // const { payload } = paymentGatewayService.verifyWebhookSignature(rawBody, signature);
    const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'payment_intent.succeeded':
        return this.handlePaymentIntentSucceeded(event.data.object);
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        return this.handlePaymentIntentFailure(event.data.object);
      default:
        return { ignored: true, reason: `Unhandled event ${event.type}` };
    }
  }

  async handlePaymentIntentSucceeded(intent) {
    const deposit = await this.findDepositForIntent(intent);
    if (!deposit) {
      return { ignored: true, reason: 'Deposit not found for payment_intent' };
    }

    if (deposit.fiatStatus === 'minted') {
      return { alreadyProcessed: true };
    }

    const amount = paymentGatewayService.fromMinorUnits(
      intent.amount_received || intent.amount,
      intent.currency
    );
    const currency = (intent.currency || deposit.fiatCurrency || 'usd').toUpperCase();

    const account = await fiatAccountRepo.findByUid(deposit.userId);
    if (!account) {
      throw new Error('Fiat account missing for deposit');
    }

    await depositRequestRepo.attachGatewayInfo(deposit._id, {
      gatewayPaymentId: intent.id,
      gatewayReferenceId: intent.latest_charge,
      amount,
      currency,
      fiatStatus: 'credited',
      clientSecret: intent.client_secret,
      customerId: intent.customer,
      receivedAt: new Date(),
    });

    const existingLedger = await fiatLedgerRepo.findByGatewayPaymentId(intent.id);
    if (existingLedger && existingLedger.status === 'settled') {
      return { alreadyProcessed: true };
    }

    const ledgerEntry =
      existingLedger ||
      (await fiatLedgerRepo.createEntry({
        uid: deposit.userId,
        type: 'credit',
        source: 'deposit',
        amount,
        currency,
        status: 'credited',
        gatewayPaymentId: intent.id,
        referenceId: intent.latest_charge,
        metadata: intent,
        occurredAt: new Date(),
      }));

    const wallet = await walletDetailsRepo.findByUid(deposit.userId);
    if (!wallet) {
      throw new Error('Wallet not found for user');
    }

    const mintResult = await kapitorTokenService.mintTo(wallet.walletAddress, amount);
    await fiatLedgerRepo.updateStatus(ledgerEntry._id, 'settled', {
      notes: 'KPT minted',
    });
    await depositRequestRepo.markFiatStatus(deposit._id, 'minted', {
      actualAmount: amount,
      status: 'confirmed',
    });

    await transactionRepo.create({
      uid: deposit.userId,
      chain: 'ethereum',
      network: process.env.ETH_NETWORK || 'mainnet',
      txHash: mintResult.txHash,
      fromAddress: 'Kapitor Treasury',
      toAddress: wallet.walletAddress,
      assetType: 'token',
      tokenAddress: process.env.KPT_TOKEN_ADDRESS,
      symbol: 'KPT',
      decimals: kapitorTokenService.decimals,
      amount: String(amount),
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

  async handlePaymentIntentFailure(intent) {
    const deposit = await this.findDepositForIntent(intent);
    if (!deposit) {
      return { ignored: true, reason: 'Deposit not found for failure' };
    }

    await depositRequestRepo.markFiatStatus(deposit._id, 'failed', {
      status: 'failed',
      remarks: intent.last_payment_error?.message || 'Stripe payment failed',
    });

    return { status: 'failed', depositId: deposit._id };
  }

  async findDepositForIntent(intent) {
    const depositId = intent.metadata?.depositId || intent.metadata?.deposit_id;
    if (depositId) {
      const deposit = await depositRequestRepo.findById(depositId);
      if (deposit) return deposit;
    }
    return depositRequestRepo.findByGatewayPaymentId(intent.id);
  }
}

module.exports = new FiatDepositService();

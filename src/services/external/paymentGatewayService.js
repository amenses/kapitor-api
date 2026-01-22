const axios = require('axios');
const crypto = require('crypto');

class PaymentGatewayService {
  constructor() {
    this.baseUrl = process.env.CASHFREE_BASE_URL || 'https://sandbox.cashfree.com/pg';
    this.payoutBaseUrl = process.env.CASHFREE_PAYOUT_BASE_URL;
    this.appId = process.env.CASHFREE_APP_ID;
    this.secretKey = process.env.CASHFREE_SECRET_KEY;
    this.webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || '';
    this.vaPrefix = process.env.CASHFREE_VA_PREFIX || 'KAPITOR';
    this.mockMode = !this.appId || !this.secretKey;
  }

  gatewayHeaders() {
    if (this.mockMode) return {};
    return {
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'Content-Type': 'application/json',
    };
  }

  async createVirtualAccount(payload) {
    if (this.mockMode) {
      const now = Date.now();
      return {
        id: `${this.vaPrefix}_${payload.customerId}`,
        accountNumber: `99${now}`.slice(-12),
        ifsc: 'CASHFREEXXX',
        bankName: 'Cashfree Mock Bank',
        upiId: `${this.vaPrefix.toLowerCase()}.${payload.customerId}@upi`,
      };
    }

    const response = await axios.post(
      `${this.baseUrl}/virtualAccount/create`,
      {
        customer_name: payload.customerName,
        customer_id: payload.customerId,
        customer_email: payload.email,
        customer_phone: payload.phone,
      },
      { headers: this.gatewayHeaders() }
    );

    const data = response.data || {};
    return {
      id: data.virtual_account_id || data.virtualAccountId,
      accountNumber: data.virtual_account_number || data.virtualAccountNumber,
      ifsc: data.ifsc || data.virtual_account_ifsc,
      bankName: data.bank || data.bank_name || 'Cashfree Partner Bank',
      upiId: data.virtual_upi_id || data.vpa || data.upi_id || null,
      raw: data,
    };
  }

  verifyWebhookSignature(rawBody, signature) {
    if (!this.webhookSecret) {
      return this.mockMode;
    }
    const computed = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody, 'utf8')
      .digest('base64');
    return computed === signature;
  }

  parseDepositPayload(payload) {
    if (!payload) return null;

    // Handle both {data:{}} and flat payloads
    const data = payload.data || payload;
    if (!data) return null;

    return {
      virtualAccountId: data.vAccountId || data.virtual_account_id || data.virtualAccountId,
      gatewayPaymentId: data.payment_reference_id || data.cf_payment_id || data.payment_id,
      amount: Number(data.amount || data.order_amount || 0),
      currency: data.currency || 'INR',
      status: (data.status || payload.event || '').toString().toUpperCase(),
      referenceId: data.referenceId || data.bank_reference || data.utr || null,
      occurredAt: data.event_time ? new Date(data.event_time) : new Date(),
      raw: payload,
    };
  }
}

module.exports = new PaymentGatewayService();

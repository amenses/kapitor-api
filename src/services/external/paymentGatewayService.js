const axios = require('axios');
const crypto = require('crypto');

class PaymentGatewayService {
  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY;
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    this.defaultCurrency = (process.env.STRIPE_DEFAULT_CURRENCY || 'usd').toLowerCase();
    this.paymentMethodTypes = (process.env.STRIPE_PAYMENT_METHOD_TYPES || 'card')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    this.webhookTolerance = Number(process.env.STRIPE_WEBHOOK_TOLERANCE || 300);
    this.apiBase = 'https://api.stripe.com/v1';
  }

  ensureConfigured() {
    if (!this.secretKey) {
      throw new Error('Stripe secret key not configured');
    }
  }

  currencyDecimals(currency = 'usd') {
    const zeroDecimal = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
    return zeroDecimal.includes(currency.toLowerCase()) ? 0 : 2;
  }

  toMinorUnits(amount, currency = this.defaultCurrency) {
    const decimals = this.currencyDecimals(currency);
    return Math.round(Number(amount) * 10 ** decimals);
  }

  fromMinorUnits(amount, currency = this.defaultCurrency) {
    const decimals = this.currencyDecimals(currency);
    return Number(amount) / 10 ** decimals;
  }

  async createPaymentIntent({ amount, currency, customerEmail, description, metadata }) {
    this.ensureConfigured();
    const body = new URLSearchParams();
    body.append('amount', String(this.toMinorUnits(amount, currency)));
    body.append('currency', (currency || this.defaultCurrency).toLowerCase());
    const methods = this.paymentMethodTypes.length ? this.paymentMethodTypes : ['card'];
    methods.forEach((method) => body.append('payment_method_types[]', method));
    if (customerEmail) {
      body.append('receipt_email', customerEmail);
    }
    body.append('capture_method', 'automatic');
    if (description) {
      body.append('description', description);
    }
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        body.append(`metadata[${key}]`, value);
      });
    }

    const response = await axios.post(`${this.apiBase}/payment_intents`, body, {
      auth: { username: this.secretKey, password: '' },
    });

    return response.data;
  }

  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!this.webhookSecret) {
      // If no secret configured we treat as always valid (development)
      return { valid: true, payload: JSON.parse(rawBody) };
    }

    if (!signatureHeader) {
      throw new Error('Missing Stripe-Signature header');
    }

    const parsed = signatureHeader.split(',').reduce(
      (acc, part) => {
        const [key, value] = part.split('=');
        if (key === 't') acc.timestamp = Number(value);
        if (key === 'v1') acc.signatures.push(value);
        return acc;
      },
      { timestamp: null, signatures: [] }
    );

    if (!parsed.timestamp || parsed.signatures.length === 0) {
      throw new Error('Invalid Stripe signature header');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(`${parsed.timestamp}.${rawBody}`)
      .digest('hex');

    const signatureMatch = parsed.signatures.some((sig) => sig === expectedSignature);

    if (!signatureMatch) {
      throw new Error('Stripe signature mismatch');
    }

    const age = Math.abs(Date.now() / 1000 - parsed.timestamp);
    if (age > this.webhookTolerance) {
      throw new Error('Stripe webhook timestamp outside tolerance');
    }

    return { valid: true, payload: JSON.parse(rawBody) };
  }
}

module.exports = new PaymentGatewayService();

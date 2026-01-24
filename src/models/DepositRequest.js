const mongoose = require('mongoose');

const DepositRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      default: 'USDT',
    },
    network: {
      type: String,
      default: 'ethereum',
    },
    expectedAmount: {
      type: Number,
      default: null,
    },
    actualAmount: {
      type: Number,
      default: null,
    },
    txHash: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    confirmations: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['waiting', 'pending_confirmation', 'confirmed', 'failed', 'manual'],
      default: 'waiting',
      index: true,
    },
    type: {
      type: String,
      enum: ['request', 'manual'],
      default: 'request',
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
    fiatAmount: {
      type: Number,
      default: null,
    },
    fiatCurrency: {
      type: String,
      default: 'USD',
    },
    fiatStatus: {
      type: String,
      enum: ['initiated', 'pending', 'credited', 'minted', 'failed'],
      default: 'initiated',
      index: true,
    },
    gatewayPaymentId: {
      type: String,
      index: true,
      sparse: true,
    },
    gatewayReferenceId: {
      type: String,
      trim: true,
    },
    stripeCustomerId: {
      type: String,
      trim: true,
    },
    stripeClientSecret: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

DepositRequestSchema.index({ walletAddress: 1, status: 1 });
DepositRequestSchema.index({ txHash: 1 });
DepositRequestSchema.index({ gatewayPaymentId: 1 });

module.exports = mongoose.model('DepositRequest', DepositRequestSchema);

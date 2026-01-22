const mongoose = require('mongoose');

const fiatLedgerSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    source: {
      type: String,
      enum: ['deposit', 'manual', 'fees', 'withdrawal'],
      default: 'deposit',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'credited', 'settled', 'failed'],
      default: 'pending',
    },
    gatewayPaymentId: {
      type: String,
      index: true,
      sparse: true,
    },
    referenceId: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    occurredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'fiat_ledger',
  }
);

fiatLedgerSchema.index({ uid: 1, occurredAt: -1 });
fiatLedgerSchema.index({ status: 1 });

module.exports = mongoose.model('FiatLedger', fiatLedgerSchema);

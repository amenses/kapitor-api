const mongoose = require('mongoose');

const fiatAccountSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
      trim: true,
    },
    accountHolder: {
      type: String,
      required: true,
      trim: true,
    },
    bankAccountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ifsc: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'blocked'],
      default: 'pending',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending',
    },
    verificationReference: {
      type: String,
      trim: true,
    },
    lastVerifiedAt: {
      type: Date,
    },
    gatewayCustomerId: {
      type: String,
      trim: true,
    },
    virtualAccountId: {
      type: String,
      trim: true,
    },
    virtualAccountNumber: {
      type: String,
      trim: true,
    },
    virtualIfsc: {
      type: String,
      trim: true,
    },
    virtualUpiId: {
      type: String,
      trim: true,
    },
    cashfreeBeneficiaryId: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'fiat_accounts',
  }
);

fiatAccountSchema.index({ bankAccountNumber: 1, ifsc: 1 }, { unique: true });
fiatAccountSchema.index({ virtualAccountId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('FiatAccount', fiatAccountSchema);

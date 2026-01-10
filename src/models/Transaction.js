const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    // User reference
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    uid: {
      // Duplicate uid for faster reads without join
      type: String,
      required: true,
      index: true,
    },

    // Blockchain info
    chain: {
      type: String, // e.g. ethereum, polygon, solana, bitcoin
      required: true,
      index: true,
    },

    network: {
      type: String, // mainnet, testnet, devnet
      required: true,
      index: true,
    },

    // Transaction identifiers
    txHash: {
      type: String,
      required: true,
      index: true,
    },

    blockNumber: {
      type: Number,
      index: true,
    },

    // Addresses
    fromAddress: {
      type: String,
      required: true,
      index: true,
    },

    toAddress: {
      type: String,
      required: true,
      index: true,
    },

    // Asset info
    assetType: {
      type: String,
      enum: ['native', 'token'],
      required: true,
      index: true,
    },

    tokenAddress: {
      type: String,
      index: true,
    },

    symbol: {
      type: String,
      index: true,
    },

    decimals: {
      type: Number,
    },

    // Amounts
    amount: {
      type: String,
      required: true,
    },

    fee: {
      type: String,
    },

    // Transaction classification
    direction: {
      type: String,
      enum: ['in', 'out'],
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        'transfer',
        'swap',
        'mint',
        'burn',
        'stake',
        'unstake',
        'reward',
        'internal',
      ],
      default: 'transfer',
      index: true,
    },

    // Status lifecycle
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending',
      index: true,
    },

    confirmations: {
      type: Number,
      default: 0,
    },

    failureReason: {
      type: String,
    },

    rawTx: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'transactions',
  }
);

// ---------- Indexes ----------
transactionSchema.index({ txHash: 1, chain: 1 }, { unique: true });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ uid: 1, createdAt: -1 });
transactionSchema.index({ fromAddress: 1 });
transactionSchema.index({ toAddress: 1 });
transactionSchema.index({ status: 1 });

// ✅ REQUIRED FOR Transaction.paginate()
transactionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Transaction', transactionSchema);

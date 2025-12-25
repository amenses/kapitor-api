const mongoose = require("mongoose");

const DepositRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    walletAddress: {
      type: String,
      required: true,
      index: true,
    },

    // USDT always for now — but future-proof
    token: {
      type: String,
      default: "USDT",
    },

    network: {
      type: String,
      default: "ethereum",
    },

    // User’s intended deposit (can be null)
    expectedAmount: {
      type: Number,
      default: null,
    },

    // Actual on-chain amount
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
      enum: [
        "waiting",              // user created request
        "pending_confirmation", // tx found but not confirmed
        "confirmed",            // credited
        "failed",               // tx reverted / invalid
        "manual",               // admin credited
      ],
      default: "waiting",
      index: true,
    },

    // request (user flow) | manual (admin-funded)
    type: {
      type: String,
      enum: ["request", "manual"],
      default: "request",
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
  },
  { timestamps: true }
);

// Helpful indexes
DepositRequestSchema.index({ walletAddress: 1, status: 1 });
DepositRequestSchema.index({ txHash: 1 });

module.exports = mongoose.model(
  "DepositRequest",
  DepositRequestSchema
);

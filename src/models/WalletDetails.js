const mongoose = require('mongoose');

const walletDetailsSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    privateKey: {
      type: String,
      required: true,
      // IMPORTANT: store this encrypted in production
    },
    password: {
      type: String,
      required: true,
      // Store a hashed password (do not store plaintext)
    },
    mnemonic: {
      type: [String],
      default: [],
      // Consider encrypting this field in production
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'wallet_details',
  }
);

// Indexes
walletDetailsSchema.index({ uid: 1 });
walletDetailsSchema.index({ createdAt: -1 });

// Remove sensitive fields when converting to JSON
walletDetailsSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.privateKey;
  delete obj.password;
  delete obj.mnemonic;
  return obj;
};

module.exports = mongoose.model('WalletDetails', walletDetailsSchema);

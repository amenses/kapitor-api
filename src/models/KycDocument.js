const mongoose = require('mongoose');

const kycDocumentSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'kyc_documents',
  }
);

// Index
kycDocumentSchema.index({ uid: 1 });

module.exports = mongoose.model('KycDocument', kycDocumentSchema);


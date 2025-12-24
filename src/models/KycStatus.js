const mongoose = require('mongoose');

const kycStatusSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'submitted', 'verified', 'rejected'],
      default: 'not_started',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'kyc_status',
  }
);

// Indexes
kycStatusSchema.index({ uid: 1 });
kycStatusSchema.index({ status: 1 });

module.exports = mongoose.model('KycStatus', kycStatusSchema);


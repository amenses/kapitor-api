const mongoose = require('mongoose');

const kybStatusSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'APPROVED', 'REJECTED'],
      default: 'NOT_STARTED',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    rejectionCategory: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    validityPeriod: {
      type: Number, // days
    },
    validityExpiresAt: {
      type: Date,
    },
    reviewedBy: {
      type: String, // reviewer uid or identifier
      trim: true,
    },
    reviewComments: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'kyb_status',
  }
);

// Indexes
kybStatusSchema.index({ uid: 1 });
kybStatusSchema.index({ status: 1 });
kybStatusSchema.index({ createdAt: -1 });

module.exports = mongoose.model('KybStatus', kybStatusSchema);


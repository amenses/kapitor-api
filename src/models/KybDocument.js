const mongoose = require('mongoose');

const kybDocumentSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      index: true,
    },
    sectionKey: {
      type: String,
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      required: true,
      trim: true,
    },
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number, // bytes
    },
    mimeType: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
    reviewStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    reviewComments: {
      type: String,
      trim: true,
    },
    ocrMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'kyb_documents',
  }
);

// Indexes
kybDocumentSchema.index({ uid: 1, sectionKey: 1 });
kybDocumentSchema.index({ uid: 1 });
kybDocumentSchema.index({ sectionKey: 1 });
kybDocumentSchema.index({ documentType: 1 });
kybDocumentSchema.index({ reviewStatus: 1 });
kybDocumentSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('KybDocument', kybDocumentSchema);


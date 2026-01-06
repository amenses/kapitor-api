const mongoose = require('mongoose');

const kybSectionSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      index: true,
    },
    sectionKey: {
      type: String,
      required: true,
      enum: [
        'BUSINESS_PROFILE',
        'BUSINESS_IDENTITY',
        'BUSINESS_ADDRESS',
        'OWNERSHIP_STRUCTURE',
        'MANAGEMENT_AUTHORITY',
        'STATUTORY_DOCUMENTS',
        'BANK_ACCOUNT_DECLARATION',
        'BUSINESS_ACTIVITY_DECLARATION',
        'RISK_REGULATORY_DECLARATIONS',
      ],
      index: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ACTION_REQUIRED'],
      default: 'NOT_STARTED',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    actionRequired: {
      type: Boolean,
      default: false,
    },
    actionComments: {
      type: String,
      trim: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'kyb_sections',
  }
);

// Compound index for unique uid + sectionKey combination
kybSectionSchema.index({ uid: 1, sectionKey: 1 }, { unique: true });
kybSectionSchema.index({ uid: 1 });
kybSectionSchema.index({ sectionKey: 1 });
kybSectionSchema.index({ status: 1 });

module.exports = mongoose.model('KybSection', kybSectionSchema);


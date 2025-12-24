const mongoose = require('mongoose');

const userBootstrapEventSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      index: true,
    },
    referralCode: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    deviceInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'user_bootstrap_events',
  }
);

// Index
userBootstrapEventSchema.index({ uid: 1 });
userBootstrapEventSchema.index({ referralCode: 1 });

module.exports = mongoose.model('UserBootstrapEvent', userBootstrapEventSchema);


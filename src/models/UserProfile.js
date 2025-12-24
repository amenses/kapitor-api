const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    dob: {
      type: Date,
    },
    addressJson: {
      type: mongoose.Schema.Types.Mixed,
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'user_profiles',
  }
);

// Index
userProfileSchema.index({ uid: 1 });

module.exports = mongoose.model('UserProfile', userProfileSchema);


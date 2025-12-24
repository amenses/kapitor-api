const mongoose = require('mongoose');

const digilockerTokenSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    tokenType: {
      type: String,
      default: 'Bearer',
    },
    scope: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'digilocker_tokens',
  }
);

// Index
digilockerTokenSchema.index({ uid: 1 });
digilockerTokenSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('DigilockerToken', digilockerTokenSchema);


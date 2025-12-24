const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      index: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'user_roles',
  }
);

// Compound index for unique user-role pairs
userRoleSchema.index({ uid: 1, roleId: 1 }, { unique: true });
userRoleSchema.index({ uid: 1 });
userRoleSchema.index({ roleId: 1 });

module.exports = mongoose.model('UserRole', userRoleSchema);


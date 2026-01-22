const { FiatAccount } = require('../models');

class FiatAccountRepository {
  create(data) {
    return FiatAccount.create(data);
  }

  upsertByUid(uid, update) {
    return FiatAccount.findOneAndUpdate(
      { uid },
      { $set: update },
      { new: true, upsert: true }
    );
  }

  findByUid(uid) {
    return FiatAccount.findOne({ uid });
  }

  findByVirtualAccountId(virtualAccountId) {
    return FiatAccount.findOne({ virtualAccountId });
  }
}

module.exports = new FiatAccountRepository();

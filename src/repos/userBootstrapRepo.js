const { UserBootstrapEvent } = require('../models');

class UserBootstrapRepository {
  /**
   * Create bootstrap event
   * @param {Object} eventData
   * @returns {Promise<Object>}
   */
  async create(eventData) {
    const event = new UserBootstrapEvent(eventData);
    return event.save();
  }
}

module.exports = new UserBootstrapRepository();


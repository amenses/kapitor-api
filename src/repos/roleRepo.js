const { Role, UserRole } = require('../models');

class RoleRepository {
  /**
   * Find role by name
   * @param {string} name
   * @returns {Promise<Object|null>}
   */
  async findByName(name) {
    return Role.findOne({ name: name.toLowerCase() });
  }

  /**
   * Create role if not exists
   * @param {string} name
   * @param {string} description
   * @returns {Promise<Object>}
   */
  async createIfNotExists(name, description = '') {
    return Role.findOneAndUpdate(
      { name: name.toLowerCase() },
      { name: name.toLowerCase(), description },
      { upsert: true, new: true }
    );
  }

  /**
   * Get user roles
   * @param {string} uid
   * @returns {Promise<Array>}
   */
  async getUserRoles(uid) {
    const userRoles = await UserRole.find({ uid }).populate('roleId', 'name');
    return userRoles.map((ur) => ur.roleId.name);
  }

  /**
   * Assign role to user
   * @param {string} uid
   * @param {string} roleName
   * @returns {Promise<Object>}
   */
  async assignRole(uid, roleName) {
    const role = await this.createIfNotExists(roleName);
    const userRole = await UserRole.findOneAndUpdate(
      { uid, roleId: role._id },
      { uid, roleId: role._id },
      { upsert: true, new: true }
    );
    return userRole;
  }

  /**
   * Remove role from user
   * @param {string} uid
   * @param {string} roleName
   * @returns {Promise<boolean>}
   */
  async removeRole(uid, roleName) {
    const role = await this.findByName(roleName);
    if (!role) return false;

    const result = await UserRole.deleteOne({ uid, roleId: role._id });
    return result.deletedCount > 0;
  }
}

module.exports = new RoleRepository();


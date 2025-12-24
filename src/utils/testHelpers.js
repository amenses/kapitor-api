/**
 * Test helper utilities for API testing
 * Only available in test mode
 */

/**
 * Generate test user data
 * @param {Object} overrides - Override default values
 * @returns {Object} Test user object
 */
function generateTestUser(overrides = {}) {
  return {
    uid: overrides.uid || 'test-user-123',
    email: overrides.email || 'test@kapitor.com',
    phone: overrides.phone || '+1234567890',
    displayName: overrides.displayName || 'Test User',
    photoUrl: overrides.photoUrl || null,
    providerIds: overrides.providerIds || ['password'],
    isKapitorWallet: overrides.isKapitorWallet || false,
    ...overrides,
  };
}

/**
 * Generate test authorization header
 * @param {Object} options - Token options
 * @returns {string} Authorization header value
 */
function generateTestAuthHeader(options = {}) {
  const { uid, email, role } = options;

  if (!uid && !email && !role) {
    return 'Bearer test-token';
  }

  const parts = ['test'];
  if (uid) parts.push(uid);
  if (email) parts.push(email.replace('@kapitor.com', ''));
  if (role) parts.push(role);

  return `Bearer ${parts.join('-')}`;
}

module.exports = {
  generateTestUser,
  generateTestAuthHeader,
};


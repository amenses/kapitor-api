/**
 * DigiLocker API Configuration
 */
const config = {
  baseUrl: process.env.DIGILOCKER_BASE_URL || 'https://api.digitallocker.gov.in/public',
  clientId: process.env.DIGILOCKER_CLIENT_ID,
  clientSecret: process.env.DIGILOCKER_CLIENT_SECRET,
  redirectUri: process.env.DIGILOCKER_REDIRECT_URI,
  defaultScope: process.env.DIGILOCKER_SCOPE || 'profile issuer',
};

/**
 * Validate DigiLocker configuration
 * @throws {Error} If configuration is incomplete
 */
function validateConfig() {
  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error('DigiLocker is not configured. Set DIGILOCKER_CLIENT_ID, DIGILOCKER_CLIENT_SECRET, and DIGILOCKER_REDIRECT_URI');
  }
}

/**
 * Check if DigiLocker is configured
 * @returns {boolean}
 */
function isConfigured() {
  return !!(config.clientId && config.clientSecret && config.redirectUri);
}

module.exports = {
  config,
  validateConfig,
  isConfigured,
};


require('dotenv').config();

/**
 * Environment configuration
 */
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [],
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
  // Test mode - allows bypassing Firebase auth (ONLY for development/testing)
  testMode: process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test',
  testUserId: process.env.TEST_USER_ID || 'test-user-123',
  testUserEmail: process.env.TEST_USER_EMAIL || 'test@kapitor.com',
};

/**
 * Validate required environment variables
 * @throws {Error} If required variables are missing
 */
function validateEnv() {
  const required = ['MONGODB_URI'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = {
  env,
  validateEnv,
};


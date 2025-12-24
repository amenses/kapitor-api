const { getAdmin, env } = require('../config');
const { sendError } = require('../utils/response');

/**
 * Verify Firebase ID token
 * In test mode, allows bypassing Firebase authentication
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
async function verifyFirebaseToken(req, res, next) {
  // Test mode: bypass Firebase authentication
  if (env.testMode) {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    // If no token provided, use default test user
    if (!token || scheme !== 'Bearer') {
      req.user = {
        uid: env.testUserId,
        email: env.testUserEmail,
        phone: '+1234567890',
        claims: {
          name: 'Test User',
          role: 'user',
        },
      };
      req.userRole = 'user';
      console.warn('⚠️  TEST MODE: Using default test user (no token provided)');
      return next();
    }

    // If token is "test" or "test-token", use test user
    if (token === 'test' || token === 'test-token') {
      req.user = {
        uid: env.testUserId,
        email: env.testUserEmail,
        phone: '+1234567890',
        claims: {
          name: 'Test User',
          role: 'user',
        },
      };
      req.userRole = 'user';
      console.warn('⚠️  TEST MODE: Using test token');
      return next();
    }

    // If token starts with "test-", extract user info from it
    if (token.startsWith('test-')) {
      const parts = token.split('-');
      const uid = parts[1] || env.testUserId;
      const email = parts[2] || env.testUserEmail;
      const role = parts[3] || 'user';

      req.user = {
        uid,
        email: `${email}@kapitor.com`,
        phone: '+1234567890',
        claims: {
          name: `Test User ${uid}`,
          role,
        },
      };
      req.userRole = role;
      console.warn(`⚠️  TEST MODE: Using test token for user ${uid}`);
      return next();
    }
  }

  // Production mode: verify Firebase token
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return sendError(res, 'Missing bearer token', 401);
    }

    const admin = getAdmin();
    const decoded = await admin.auth().verifyIdToken(token, true);

    // Attach user info to request
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      phone: decoded.phone_number,
      claims: decoded,
    };

    // Extract role from custom claims or default to 'user'
    req.userRole = decoded.role || 'user';

    next();
  } catch (error) {
    const status = error?.code === 'auth/id-token-revoked' ? 401 : 401;
    return sendError(res, 'Invalid or expired token', status);
  }
}

module.exports = {
  verifyFirebaseToken,
};


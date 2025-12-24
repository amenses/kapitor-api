const express = require('express');
const { env } = require('../config');
const { sendSuccess, sendError } = require('../utils/response');
const { generateTestUser, generateTestAuthHeader } = require('../utils/testHelpers');

const router = express.Router();

// Only allow test routes in test mode
if (!env.testMode) {
  router.use((req, res) => {
    sendError(res, 'Test routes are only available in test mode. Set TEST_MODE=true', 403);
  });
  module.exports = router;
  return;
}

/**
 * GET /test/info
 * Get test mode information and example requests
 */
router.get('/info', (req, res) => {
  sendSuccess(res, {
    testMode: true,
    message: 'Test mode is enabled. Use the examples below to test APIs.',
    examples: {
      defaultUser: generateTestUser(),
      authHeaders: {
        default: generateTestAuthHeader(),
        customUser: generateTestAuthHeader({ uid: 'custom-uid', email: 'custom@kapitor.com' }),
        adminUser: generateTestAuthHeader({ uid: 'admin-uid', role: 'admin' }),
      },
      curlExamples: {
        bootstrap: `curl -X POST http://localhost:${env.port}/users/bootstrap \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token" \\
  -d '{"referralCode": "TEST123"}'`,
        getProfile: `curl -X GET http://localhost:${env.port}/users/me \\
  -H "Authorization: Bearer test-token"`,
        updateKYC: `curl -X POST http://localhost:${env.port}/kyc \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token" \\
  -d '{"status": "submitted"}'`,
      },
    },
  });
});

/**
 * GET /test/user
 * Get current test user info (simulates authenticated user)
 */
router.get('/user', (req, res) => {
  sendSuccess(res, {
    user: req.user || generateTestUser(),
    userRole: req.userRole || 'user',
    message: 'This is the user object that would be available in authenticated routes',
  });
});

/**
 * GET /test/token
 * Generate a Firebase custom token for testing
 * Query params:
 *   - uid: User ID (default: 'test-user-123')
 *   - role: User role (default: 'user')
 *   - email: User email (optional)
 */
router.get('/token', async (req, res) => {
  try {
    const { getAdmin } = require('../config');
    const axios = require('axios');
    
    // Force Firebase initialization even in test mode for token generation
    const admin = getAdmin(true);

    // Hardcoded test user details
    const uid = req.query.uid || 'test-user-123';
    const role = req.query.role || 'user';
    const email = req.query.email || `test-${uid}@kapitor.com`;

    // Custom claims
    const customClaims = {
      role: role,
      email: email,
    };

    // Step 1: Create or get user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUser(uid);
    } catch (error) {
      // User doesn't exist, create it
      firebaseUser = await admin.auth().createUser({
        uid,
        email,
        emailVerified: true,
      });
    }

    // Step 2: Set custom claims
    await admin.auth().setCustomUserClaims(uid, customClaims);

    // Step 3: Generate custom token
    const customToken = await admin.auth().createCustomToken(uid, customClaims);

    // Step 4: Exchange custom token for ID token using Firebase REST API
    // Get API key from service account project_id or use environment variable
    const serviceAccount = require('../config/firebase-service-account.json');
    const projectId = serviceAccount.project_id;
    const apiKey = process.env.FIREBASE_API_KEY;

    let idToken = customToken; // Fallback to custom token if exchange fails

    if (apiKey) {
      try {
        const exchangeResponse = await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
          {
            token: customToken,
            returnSecureToken: true,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (exchangeResponse.data && exchangeResponse.data.idToken) {
          idToken = exchangeResponse.data.idToken;
        }
      } catch (exchangeError) {
        console.warn('⚠️  Failed to exchange custom token for ID token:', exchangeError.message);
        console.warn('⚠️  Using custom token instead. Note: Custom tokens need to be exchanged on client side.');
      }
    } else {
      console.warn('⚠️  FIREBASE_API_KEY not set. Cannot exchange custom token for ID token.');
      console.warn('⚠️  Set FIREBASE_API_KEY in .env to get ID tokens directly.');
    }

    sendSuccess(res, {
      message: 'Firebase token generated successfully',
      token: idToken,
      tokenType: apiKey && idToken !== customToken ? 'idToken' : 'customToken',
      user: {
        uid,
        email,
        role,
      },
      usage: {
        note: apiKey && idToken !== customToken
          ? 'This is an ID token ready to use in API calls.'
          : 'This is a custom token. Set FIREBASE_API_KEY in .env to get ID tokens automatically.',
        example: `curl -H "Authorization: Bearer ${idToken.substring(0, 50)}..." http://localhost:${env.port}/users/me`,
      },
      ...(idToken === customToken && {
        warning: 'Custom token returned. Set FIREBASE_API_KEY in .env to exchange for ID token automatically.',
      }),
    });
  } catch (error) {
    console.error('Error generating token:', error);
    sendError(res, `Failed to generate token: ${error.message}`, 500);
  }
});

/**
 * POST /test/token
 * Generate a Firebase custom token with custom parameters
 * Body:
 *   - uid: User ID (optional, default: 'test-user-123')
 *   - role: User role (optional, default: 'user')
 *   - email: User email (optional)
 *   - claims: Additional custom claims (optional)
 */
router.post('/token', async (req, res) => {
  try {
    const { getAdmin } = require('../config');
    const axios = require('axios');
    
    // Force Firebase initialization even in test mode for token generation
    const admin = getAdmin(true);

    // Hardcoded defaults with request body overrides
    const uid = req.body.uid || 'test-user-123';
    const role = req.body.role || 'user';
    const email = req.body.email || `test-${uid}@kapitor.com`;

    // Merge custom claims
    const customClaims = {
      role: role,
      email: email,
      ...(req.body.claims || {}),
    };

    // Step 1: Create or get user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUser(uid);
    } catch (error) {
      // User doesn't exist, create it
      firebaseUser = await admin.auth().createUser({
        uid,
        email,
        emailVerified: true,
      });
    }

    // Step 2: Set custom claims
    await admin.auth().setCustomUserClaims(uid, customClaims);

    // Step 3: Generate custom token
    const customToken = await admin.auth().createCustomToken(uid, customClaims);

    // Step 4: Exchange custom token for ID token using Firebase REST API
    const apiKey = process.env.FIREBASE_API_KEY;
    let idToken = customToken; // Fallback to custom token if exchange fails

    if (apiKey) {
      try {
        const exchangeResponse = await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
          {
            token: customToken,
            returnSecureToken: true,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (exchangeResponse.data && exchangeResponse.data.idToken) {
          idToken = exchangeResponse.data.idToken;
        }
      } catch (exchangeError) {
        console.warn('⚠️  Failed to exchange custom token for ID token:', exchangeError.message);
        console.warn('⚠️  Using custom token instead. Note: Custom tokens need to be exchanged on client side.');
      }
    } else {
      console.warn('⚠️  FIREBASE_API_KEY not set. Cannot exchange custom token for ID token.');
      console.warn('⚠️  Set FIREBASE_API_KEY in .env to get ID tokens directly.');
    }

    sendSuccess(res, {
      message: 'Firebase token generated successfully',
      token: idToken,
      tokenType: apiKey && idToken !== customToken ? 'idToken' : 'customToken',
      user: {
        uid,
        email,
        role,
        claims: customClaims,
      },
      usage: {
        note: apiKey && idToken !== customToken
          ? 'This is an ID token ready to use in API calls.'
          : 'This is a custom token. Set FIREBASE_API_KEY in .env to get ID tokens automatically.',
        example: `curl -H "Authorization: Bearer ${idToken.substring(0, 50)}..." http://localhost:${env.port}/users/me`,
      },
      ...(idToken === customToken && {
        warning: 'Custom token returned. Set FIREBASE_API_KEY in .env to exchange for ID token automatically.',
      }),
    });
  } catch (error) {
    console.error('Error generating token:', error);
    sendError(res, `Failed to generate token: ${error.message}`, 500);
  }
});

module.exports = router;


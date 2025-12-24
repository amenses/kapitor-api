const admin = require('firebase-admin');

let isInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * In test mode, Firebase initialization is skipped
 */
function initializeFirebase(forceInit = false) {
  // Lazy load env to avoid circular dependency
  const { env } = require('./env');

  // Skip Firebase initialization in test mode (unless forced for token generation)
  if (env.testMode && !forceInit) {
    console.warn('⚠️  TEST MODE: Skipping Firebase initialization');
    isInitialized = true; // Mark as initialized to prevent errors
    return admin;
  }

  // Check if Firebase app is actually initialized (not just the flag)
  if (admin.apps.length > 0) {
    isInitialized = true;
    return admin;
  }
  
  // If forcing init, reset the flag
  if (forceInit) {
    isInitialized = false;
  }
  
  // If already initialized (flag) and not forcing, return early
  if (isInitialized && !forceInit) {
    return admin;
  }

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    try {
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(decoded)),
      });
      isInitialized = true;
      console.log('✅ Firebase Admin initialized (base64)');
      return admin;
    } catch (error) {
      console.error('❌ Failed to parse Firebase service account from base64:', error);
      throw new Error('Firebase service account configuration error');
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isInitialized = true;
      console.log('✅ Firebase Admin initialized (credentials file)');
      return admin;
    } catch (error) {
      console.error('❌ Failed to load Firebase credentials file:', error);
      throw new Error('Firebase service account configuration error');
    }
  }

  // Check for FIREBASE_SERVICE_ACCOUNT_JSON path
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const path = require('path');
      const fs = require('fs');
      let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

      // Resolve relative paths from project root
      if (!path.isAbsolute(serviceAccountPath)) {
        serviceAccountPath = path.resolve(process.cwd(), serviceAccountPath);
      }

      // Check if file exists
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Firebase service account file not found: ${serviceAccountPath}`);
      }

      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isInitialized = true;
      console.log('✅ Firebase Admin initialized (service account JSON file)');
      return admin;
    } catch (error) {
      console.error('❌ Failed to load Firebase service account JSON file:', error.message);
      throw new Error('Firebase service account configuration error');
    }
  }

  // In test mode, don't throw error if Firebase is not configured
  const { env: envCheck } = require('./env');
  if (envCheck.testMode) {
    console.warn('⚠️  TEST MODE: Firebase not configured, but continuing in test mode');
    isInitialized = true;
    return admin;
  }

  throw new Error('Firebase service account not configured. Set FIREBASE_SERVICE_ACCOUNT_BASE64, GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_SERVICE_ACCOUNT_JSON');
}

module.exports = {
  initializeFirebase: (forceInit) => initializeFirebase(forceInit),
  getAdmin: (forceInit = false) => {
    const { env } = require('./env');
    
    // If forceInit is true, reset the flag and initialize
    if (forceInit) {
      isInitialized = false;
      initializeFirebase(true);
      return admin;
    }
    
    // Normal initialization (skip in test mode)
    if (!isInitialized) {
      if (!env.testMode) {
        initializeFirebase(false);
      }
    }
    
    return admin;
  },
};


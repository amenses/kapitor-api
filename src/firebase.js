const admin = require('firebase-admin');

// Initialize admin only once
if (!admin.apps.length) {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(decoded)),
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
    });
  } else {
    throw new Error('Firebase service account not configured');
  }
}

module.exports = admin;
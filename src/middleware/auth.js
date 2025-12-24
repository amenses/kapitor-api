const admin = require('../firebase');

async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    // verifyIdToken with revocation check
    const decoded = await admin.auth().verifyIdToken(token, true);

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      phone: decoded.phone_number,
      claims: decoded,
    };
    req.userRole = decoded.role || 'user';

    return next();
  } catch (err) {
    const status = err?.code === 'auth/id-token-revoked' ? 401 : 401;
    return res.status(status).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { verifyFirebaseToken };


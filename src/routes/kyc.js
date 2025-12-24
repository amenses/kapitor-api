const express = require('express');
const Joi = require('joi');
const crypto = require('crypto');
const pool = require('../db/pool');

const router = express.Router();

const kycSchema = Joi.object({
  aadhaarFrontUrl: Joi.string().uri().optional(),
  aadhaarBackUrl: Joi.string().uri().optional(),
  panUrl: Joi.string().uri().optional(),
  selfieUrl: Joi.string().uri().optional(),
  status: Joi.string()
    .valid('in_progress', 'submitted', 'verified', 'rejected')
    .optional(),
});

router.get('/status', async (req, res) => {
  try {
    const [[kyc]] = await pool.execute('SELECT * FROM kyc_status WHERE uid = ?', [req.user.uid]);
    return res.json({ kyc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

router.post('/', async (req, res) => {
  const { error, value } = kycSchema.validate(req.body || {});
  if (error) return res.status(400).json({ error: error.message });

  const { status, ...files } = value;
  const fileUrls = Object.entries(files).reduce((acc, [k, v]) => {
    if (v) acc[k] = v;
    return acc;
  }, {});

  try {
    await pool.execute(
      `UPDATE kyc_status
       SET status = COALESCE(?, status),
           submitted_at = IF(? = 'submitted', NOW(), submitted_at),
           verified_at = IF(? = 'verified', NOW(), verified_at)
       WHERE uid = ?`,
      [status || null, status, status, req.user.uid]
    );

    if (Object.keys(fileUrls).length) {
      await pool.execute(
        `INSERT INTO kyc_documents (uid, payload)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = NOW()`,
        [req.user.uid, JSON.stringify(fileUrls)]
      );
    }

    return res.json({ status: status || 'in_progress' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update KYC' });
  }
});

// ---------------- DigiLocker integration ----------------
const DIGI_BASE = process.env.DIGILOCKER_BASE_URL || 'https://api.digitallocker.gov.in/public';
const DIGI_CLIENT_ID = process.env.DIGILOCKER_CLIENT_ID;
const DIGI_CLIENT_SECRET = process.env.DIGILOCKER_CLIENT_SECRET;
const DIGI_REDIRECT = process.env.DIGILOCKER_REDIRECT_URI;

const requireDigiConfig = () => {
  if (!DIGI_CLIENT_ID || !DIGI_CLIENT_SECRET || !DIGI_REDIRECT) {
    const err = new Error('DigiLocker is not configured');
    err.status = 500;
    throw err;
  }
};

router.get('/digilocker/authorize', (req, res) => {
  try {
    requireDigiConfig();
    const state = crypto.randomBytes(12).toString('hex');
    const url = new URL(`${DIGI_BASE}/oauth2/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', DIGI_CLIENT_ID);
    url.searchParams.set('redirect_uri', DIGI_REDIRECT);
    url.searchParams.set('state', state);
    // Scope depends on required artifacts; adjust as per approval
    url.searchParams.set('scope', 'profile issuer');
    return res.json({ url: url.toString(), state });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
});

router.post('/digilocker/callback', async (req, res) => {
  try {
    requireDigiConfig();
    const bodySchema = Joi.object({
      code: Joi.string().required(),
      state: Joi.string().optional(),
    });
    const { error, value } = bodySchema.validate(req.body || {});
    if (error) return res.status(400).json({ error: error.message });

    const { code } = value;
    const tokenResp = await fetch(`${DIGI_BASE}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: DIGI_CLIENT_ID,
        client_secret: DIGI_CLIENT_SECRET,
        redirect_uri: DIGI_REDIRECT,
      }),
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      return res.status(502).json({ error: 'DigiLocker token exchange failed', detail: text });
    }

    const tokenJson = await tokenResp.json();
    const expiresAt = tokenJson.expires_in
      ? new Date(Date.now() + tokenJson.expires_in * 1000)
      : null;

    await pool.execute(
      `INSERT INTO digilocker_tokens (uid, access_token, refresh_token, token_type, scope, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         access_token = VALUES(access_token),
         refresh_token = VALUES(refresh_token),
         token_type = VALUES(token_type),
         scope = VALUES(scope),
         expires_at = VALUES(expires_at)`,
      [
        req.user.uid,
        tokenJson.access_token,
        tokenJson.refresh_token || null,
        tokenJson.token_type || 'Bearer',
        tokenJson.scope || null,
        expiresAt ? expiresAt.toISOString().slice(0, 19).replace('T', ' ') : null,
      ]
    );

    return res.json({ status: 'linked', expiresAt, scope: tokenJson.scope });
  } catch (err) {
    const status = err.status || 500;
    console.error(err);
    return res.status(status).json({ error: err.message || 'DigiLocker callback failed' });
  }
});

router.get('/digilocker/documents', async (req, res) => {
  try {
    requireDigiConfig();
    const [[tokenRow]] = await pool.execute(
      `SELECT access_token FROM digilocker_tokens WHERE uid = ?`,
      [req.user.uid]
    );
    if (!tokenRow?.access_token) {
      return res.status(400).json({ error: 'DigiLocker not linked' });
    }

    const docsResp = await fetch(`${DIGI_BASE}/v1/files/issued`, {
      headers: { Authorization: `Bearer ${tokenRow.access_token}` },
    });

    if (!docsResp.ok) {
      const text = await docsResp.text();
      return res.status(502).json({ error: 'Failed to fetch DigiLocker documents', detail: text });
    }

    const docs = await docsResp.json();

    // Persist a snapshot for auditing
    await pool.execute(
      `INSERT INTO kyc_documents (uid, payload)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = NOW()`,
      [req.user.uid, JSON.stringify({ digilocker: docs })]
    );

    return res.json({ documents: docs });
  } catch (err) {
    const status = err.status || 500;
    console.error(err);
    return res.status(status).json({ error: err.message || 'Failed to fetch DigiLocker documents' });
  }
});

module.exports = router;


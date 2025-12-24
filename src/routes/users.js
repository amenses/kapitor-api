const express = require('express');
const Joi = require('joi');
const pool = require('../db/pool');
const admin = require('../firebase');

const router = express.Router();

const bootstrapSchema = Joi.object({
  referralCode: Joi.string().max(32).optional(),
  deviceInfo: Joi.object().unknown(true).optional(),
});

router.post('/bootstrap', async (req, res) => {
  const { error, value } = bootstrapSchema.validate(req.body || {});
  if (error) return res.status(400).json({ error: error.message });

  const { referralCode, deviceInfo } = value;
  const { uid, email, phone } = req.user;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Upsert user
    await conn.execute(
      `INSERT INTO users (uid, email, phone, display_name, photo_url, provider_ids)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email = VALUES(email),
         phone = VALUES(phone),
         display_name = VALUES(display_name),
         photo_url = VALUES(photo_url),
         last_login_at = NOW(),
         provider_ids = VALUES(provider_ids)`,
      [
        uid,
        email,
        phone,
        req.user.claims.name || null,
        req.user.claims.picture || null,
        JSON.stringify(req.user.claims.firebase?.sign_in_provider ? [req.user.claims.firebase.sign_in_provider] : []),
      ]
    );

    // user_profiles
    await conn.execute(
      `INSERT IGNORE INTO user_profiles (uid, preferences)
       VALUES (?, ?)
      `,
      [uid, JSON.stringify({})]
    );

    // kyc_status
    await conn.execute(
      `INSERT IGNORE INTO kyc_status (uid, status) VALUES (?, 'not_started')`,
      [uid]
    );

    // Optional: store referral/device info in an audit table (example)
    if (referralCode || deviceInfo) {
      await conn.execute(
        `INSERT INTO user_bootstrap_events (uid, referral_code, device_info)
         VALUES (?, ?, ?)`,
        [uid, referralCode || null, JSON.stringify(deviceInfo || {})]
      );
    }

    // Default claim
    const currentClaims = (await admin.auth().getUser(uid)).customClaims || {};
    if (!currentClaims.role) {
      await admin.auth().setCustomUserClaims(uid, { ...currentClaims, role: 'user' });
    }

    await conn.commit();

    return res.json({
      user: {
        uid,
        email,
        phone,
        role: currentClaims.role || 'user',
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ error: 'Failed to bootstrap user' });
  } finally {
    conn.release();
  }
});

router.get('/me', async (req, res) => {
  const { uid } = req.user;
  try {
    const [[user]] = await pool.execute('SELECT * FROM users WHERE uid = ?', [uid]);
    const [[profile]] = await pool.execute('SELECT * FROM user_profiles WHERE uid = ?', [uid]);
    const [[kyc]] = await pool.execute('SELECT * FROM kyc_status WHERE uid = ?', [uid]);
    return res.json({ user, profile, kycStatus: kyc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

const patchSchema = Joi.object({
  fullName: Joi.string().max(255).optional(),
  phone: Joi.string().max(32).optional(),
  preferences: Joi.object().unknown(true).optional(),
});

router.patch('/me', async (req, res) => {
  const { error, value } = patchSchema.validate(req.body || {});
  if (error) return res.status(400).json({ error: error.message });

  const { uid } = req.user;
  const { fullName, phone, preferences } = value;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (phone) {
      await conn.execute('UPDATE users SET phone = ? WHERE uid = ?', [phone, uid]);
    }
    if (fullName || preferences) {
      await conn.execute(
        `UPDATE user_profiles
         SET full_name = COALESCE(?, full_name),
             preferences = COALESCE(?, preferences)
         WHERE uid = ?`,
        [fullName || null, preferences ? JSON.stringify(preferences) : null, uid]
      );
    }
    await conn.commit();
    return res.json({ status: 'ok' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ error: 'Failed to update profile' });
  } finally {
    conn.release();
  }
});

router.get('/roles', async (req, res) => {
  const { uid } = req.user;
  try {
    const [rows] = await pool.execute(
      `SELECT r.name
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.uid = ?`,
      [uid]
    );
    return res.json({ roles: rows.map((r) => r.name) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

module.exports = router;


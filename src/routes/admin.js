const express = require('express');
const Joi = require('joi');
const pool = require('../db/pool');
const { requireRole } = require('../middleware/rbac');
const admin = require('../firebase');

const router = express.Router();

const roleSchema = Joi.object({
  role: Joi.string().required(),
});

router.post('/users/:uid/roles', requireRole(['admin']), async (req, res) => {
  const { error, value } = roleSchema.validate(req.body || {});
  if (error) return res.status(400).json({ error: error.message });

  const { uid } = req.params;
  const { role } = value;

  try {
    // Ensure role exists
    await pool.execute(`INSERT IGNORE INTO roles (name) VALUES (?)`, [role]);
    const [[roleRow]] = await pool.execute(`SELECT id FROM roles WHERE name = ?`, [role]);
    await pool.execute(
      `INSERT IGNORE INTO user_roles (uid, role_id) VALUES (?, ?)`,
      [uid, roleRow.id]
    );

    // Also set custom claim for coarse control
    const currentClaims = (await admin.auth().getUser(uid)).customClaims || {};
    await admin.auth().setCustomUserClaims(uid, { ...currentClaims, role });

    return res.json({ status: 'ok', role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to assign role' });
  }
});

router.get('/users', requireRole(['admin']), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  try {
    const [rows] = await pool.execute(
      `SELECT u.uid, u.email, u.phone, ks.status as kyc_status
       FROM users u
       LEFT JOIN kyc_status ks ON ks.uid = u.uid
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return res.json({ data: rows, limit, offset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to list users' });
  }
});

module.exports = router;


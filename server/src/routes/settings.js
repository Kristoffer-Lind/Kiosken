const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const { generateToken, requireAuth } = require('../middleware/auth');

const isHashed = (s) => s && s.startsWith('$2');

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT key, value FROM settings');
  const result = {};
  rows.forEach(r => {
    if (r.key !== 'pin') result[r.key] = r.value;
  });
  res.json(result);
});

router.post('/verify-pin', async (req, res) => {
  const { pin } = req.body;
  const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'pin'");
  if (!rows.length) return res.status(500).json({ error: 'PIN ej konfigurerat' });

  const stored = rows[0].value;
  let ok = false;

  if (isHashed(stored)) {
    ok = await bcrypt.compare(String(pin), stored);
  } else {
    // Migrate plain-text PIN to hash on first successful login
    ok = stored === String(pin);
    if (ok) {
      const hashed = await bcrypt.hash(String(pin), 10);
      await pool.query("UPDATE settings SET value = $1 WHERE key = 'pin'", [hashed]);
    }
  }

  if (!ok) return res.json({ ok: false });
  const token = generateToken();
  res.json({ ok: true, token });
});

router.put('/', requireAuth, async (req, res) => {
  const { swish_number, shop_name, new_pin, logo_base64, swish_qr_base64 } = req.body;

  const toUpsert = [];
  if (swish_number !== undefined) toUpsert.push(['swish_number', swish_number]);
  if (shop_name !== undefined) toUpsert.push(['shop_name', shop_name]);
  if (logo_base64 !== undefined) toUpsert.push(['logo_base64', logo_base64]);
  if (swish_qr_base64 !== undefined) toUpsert.push(['swish_qr_base64', swish_qr_base64]);

  if (toUpsert.length) {
    const placeholders = toUpsert.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ${placeholders} ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      toUpsert.flat()
    );
  }

  if (new_pin) {
    const hashed = await bcrypt.hash(String(new_pin), 10);
    await pool.query("UPDATE settings SET value = $1 WHERE key = 'pin'", [hashed]);
  }

  res.json({ ok: true });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT key, value FROM settings');
  const result = {};
  rows.forEach(r => {
    result[r.key] = r.key === 'pin' ? undefined : r.value;
  });
  res.json(result);
});

router.post('/verify-pin', async (req, res) => {
  const { pin } = req.body;
  const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'pin'");
  if (!rows.length) return res.status(500).json({ error: 'PIN ej konfigurerat' });
  const correct = rows[0].value === String(pin);
  res.json({ ok: correct });
});

router.put('/', async (req, res) => {
  const { swish_number, shop_name, pin, new_pin } = req.body;

  if (pin !== undefined) {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'pin'");
    if (!rows.length || rows[0].value !== String(pin)) {
      return res.status(401).json({ error: 'Fel PIN' });
    }
    if (new_pin) {
      await pool.query("UPDATE settings SET value = $1 WHERE key = 'pin'", [String(new_pin)]);
    }
  }

  if (swish_number !== undefined) {
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('swish_number', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [swish_number]
    );
  }
  if (shop_name !== undefined) {
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('shop_name', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [shop_name]
    );
  }
  res.json({ ok: true });
});

module.exports = router;

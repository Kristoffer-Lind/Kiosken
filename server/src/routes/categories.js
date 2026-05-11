const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY sort_order, name');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name, sort_order = 0 } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO categories (name, sort_order) VALUES ($1, $2) RETURNING *',
    [name, sort_order]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { name, sort_order } = req.body;
  const { rows } = await pool.query(
    'UPDATE categories SET name = COALESCE($1, name), sort_order = COALESCE($2, sort_order) WHERE id = $3 RETURNING *',
    [name, sort_order, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Ej hittad' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;

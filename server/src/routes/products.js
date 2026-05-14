const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY c.sort_order, c.name, p.sort_order, p.name
  `);
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { name, price, category_id, sort_order = 0, emoji, emoji2 } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO products (name, price, category_id, sort_order, emoji, emoji2) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, price, category_id || null, sort_order, emoji || null, emoji2 || null]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', requireAuth, async (req, res) => {
  const { name, price, category_id, available, sort_order, emoji, emoji2 } = req.body;
  const fields = [];
  const values = [];
  let i = 1;
  if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name); }
  if (price !== undefined) { fields.push(`price = $${i++}`); values.push(price); }
  if (category_id !== undefined) { fields.push(`category_id = $${i++}`); values.push(category_id || null); }
  if (available !== undefined) { fields.push(`available = $${i++}`); values.push(available === 'true' || available === true); }
  if (sort_order !== undefined) { fields.push(`sort_order = $${i++}`); values.push(sort_order); }
  if (emoji !== undefined) { fields.push(`emoji = $${i++}`); values.push(emoji || null); }
  if (emoji2 !== undefined) { fields.push(`emoji2 = $${i++}`); values.push(emoji2 || null); }
  if (!fields.length) return res.status(400).json({ error: 'Inga fält att uppdatera' });
  values.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values
  );
  if (!rows.length) return res.status(404).json({ error: 'Ej hittad' });
  res.json(rows[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;

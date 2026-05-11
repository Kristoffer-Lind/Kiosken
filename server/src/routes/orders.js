const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.post('/', async (req, res) => {
  const { items, note } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Inga produkter' });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [order] } = await client.query(
      'INSERT INTO orders (total, note) VALUES ($1, $2) RETURNING *',
      [total, note || null]
    );
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity) VALUES ($1, $2, $3, $4, $5)',
        [order.id, item.product_id || null, item.name, item.price, item.quantity]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

router.get('/', async (req, res) => {
  const { from, to, limit = 100 } = req.query;
  let where = [];
  let values = [];
  let i = 1;
  if (from) { where.push(`created_at >= $${i++}`); values.push(from); }
  if (to) { where.push(`created_at <= $${i++}`); values.push(to); }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  values.push(limit);

  const { rows } = await pool.query(
    `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT $${i}`,
    values
  );
  res.json(rows);
});

router.get('/:id/items', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [req.params.id]
  );
  res.json(rows);
});

module.exports = router;

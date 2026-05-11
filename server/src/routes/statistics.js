const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  const { from, to } = req.query;
  let dateFilter = '';
  const values = [];
  let i = 1;
  if (from) { dateFilter += ` AND o.created_at >= $${i++}`; values.push(from); }
  if (to) { dateFilter += ` AND o.created_at <= $${i++}`; values.push(to); }

  const [summary, byProduct, byCategory, byDay] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS order_count, COALESCE(SUM(total), 0) AS total_revenue
       FROM orders o WHERE TRUE ${dateFilter}`,
      values
    ),
    pool.query(
      `SELECT oi.product_name, COALESCE(p.category_id, 0) AS category_id,
              COALESCE(c.name, 'Okategoriserad') AS category_name,
              SUM(oi.quantity) AS qty_sold,
              SUM(oi.quantity * oi.product_price) AS revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE TRUE ${dateFilter}
       GROUP BY oi.product_name, p.category_id, c.name
       ORDER BY revenue DESC`,
      values
    ),
    pool.query(
      `SELECT COALESCE(c.name, 'Okategoriserad') AS category_name,
              SUM(oi.quantity) AS qty_sold,
              SUM(oi.quantity * oi.product_price) AS revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE TRUE ${dateFilter}
       GROUP BY c.name
       ORDER BY revenue DESC`,
      values
    ),
    pool.query(
      `SELECT DATE(o.created_at) AS day, COUNT(*) AS orders, SUM(o.total) AS revenue
       FROM orders o WHERE TRUE ${dateFilter}
       GROUP BY DATE(o.created_at)
       ORDER BY day DESC
       LIMIT 30`,
      values
    ),
  ]);

  res.json({
    summary: summary.rows[0],
    by_product: byProduct.rows,
    by_category: byCategory.rows,
    by_day: byDay.rows,
  });
});

module.exports = router;

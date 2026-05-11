const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const { from, to } = req.query;
  let dateFilter = ''; const values = []; let i = 1;
  if (from) { dateFilter += ` AND o.created_at >= $${i++}`; values.push(from); }
  if (to) { dateFilter += ` AND o.created_at <= $${i++}`; values.push(to + 'T23:59:59'); }

  const [summary, byProduct, byCategory] = await Promise.all([
    pool.query(`SELECT COUNT(*) AS order_count, COALESCE(SUM(total), 0) AS total_revenue FROM orders o WHERE TRUE ${dateFilter}`, values),
    pool.query(`SELECT oi.product_name, COALESCE(c.name, 'Okategoriserad') AS category_name, SUM(oi.quantity) AS qty_sold, SUM(oi.quantity * oi.product_price) AS revenue FROM order_items oi JOIN orders o ON oi.order_id = o.id LEFT JOIN products p ON oi.product_id = p.id LEFT JOIN categories c ON p.category_id = c.id WHERE TRUE ${dateFilter} GROUP BY oi.product_name, c.name ORDER BY revenue DESC`, values),
    pool.query(`SELECT COALESCE(c.name, 'Okategoriserad') AS category_name, SUM(oi.quantity) AS qty_sold, SUM(oi.quantity * oi.product_price) AS revenue FROM order_items oi JOIN orders o ON oi.order_id = o.id LEFT JOIN products p ON oi.product_id = p.id LEFT JOIN categories c ON p.category_id = c.id WHERE TRUE ${dateFilter} GROUP BY c.name ORDER BY revenue DESC`, values),
  ]);

  res.json({ summary: summary.rows[0], by_product: byProduct.rows, by_category: byCategory.rows });
});

module.exports = router;

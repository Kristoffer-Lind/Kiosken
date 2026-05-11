const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY c.sort_order, c.name, p.sort_order, p.name
  `);
  res.json(rows);
});

router.post('/', upload.single('image'), async (req, res) => {
  const { name, price, category_id, sort_order = 0 } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const { rows } = await pool.query(
    'INSERT INTO products (name, price, category_id, image_url, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, price, category_id || null, image_url, sort_order]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', upload.single('image'), async (req, res) => {
  const { name, price, category_id, available, sort_order } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;

  const fields = [];
  const values = [];
  let i = 1;

  if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name); }
  if (price !== undefined) { fields.push(`price = $${i++}`); values.push(price); }
  if (category_id !== undefined) { fields.push(`category_id = $${i++}`); values.push(category_id || null); }
  if (available !== undefined) { fields.push(`available = $${i++}`); values.push(available === 'true' || available === true); }
  if (sort_order !== undefined) { fields.push(`sort_order = $${i++}`); values.push(sort_order); }
  if (image_url !== undefined) { fields.push(`image_url = $${i++}`); values.push(image_url); }

  if (!fields.length) return res.status(400).json({ error: 'Inga fält att uppdatera' });

  values.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'Ej hittad' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;

const router = require('express').Router();
const db = require('../db');

const SORTS = {
  newest: 'p.created_at DESC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  name: 'p.name ASC',
  rating: 'avg_rating DESC',
};

// GET /api/products?q=rice&category=Grocery&sort=price_asc&min=0&max=500
router.get('/', async (req, res, next) => {
  try {
    const { q, category, sort = 'newest', min, max } = req.query;
    const where = [];
    const params = [];

    if (q) {
      where.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      where.push('p.category = ?');
      params.push(category);
    }
    if (min) { where.push('p.price >= ?'); params.push(Number(min)); }
    if (max) { where.push('p.price <= ?'); params.push(Number(max)); }

    const orderBy = SORTS[sort] || SORTS.newest;
    const sql = `
      SELECT p.*, COALESCE(AVG(r.rating), 0) AS avg_rating, COUNT(r.id) AS review_count
      FROM products p
      LEFT JOIN reviews r ON r.product_id = p.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY p.id
      ORDER BY ${orderBy}`;
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/categories', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT category FROM products ORDER BY category');
    res.json(rows.map((r) => r.category));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, COALESCE(AVG(r.rating), 0) AS avg_rating, COUNT(r.id) AS review_count
       FROM products p LEFT JOIN reviews r ON r.product_id = p.id
       WHERE p.id = ? GROUP BY p.id`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found.' });
    const [reviews] = await db.query(
      'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json({ ...rows[0], reviews });
  } catch (e) { next(e); }
});

router.post('/:id/reviews', async (req, res, next) => {
  try {
    const { name, rating, comment } = req.body;
    if (!name || !rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Name and a rating from 1 to 5 are required.' });
    await db.query(
      'INSERT INTO reviews (product_id, name, rating, comment) VALUES (?, ?, ?, ?)',
      [req.params.id, name, rating, comment || '']);
    res.status(201).json({ message: 'Review added.' });
  } catch (e) { next(e); }
});

module.exports = router;

const router = require('express').Router();
const db = require('../db');

const STATUSES = ['Placed', 'Packed', 'Out for delivery', 'Delivered', 'Cancelled'];

// Place an order. Prices are read from the DB, never trusted from the browser.
router.post('/', async (req, res, next) => {
  const { customer_name, phone, address, items } = req.body;
  if (!customer_name || !phone || !address || !Array.isArray(items) || !items.length)
    return res.status(400).json({ error: 'Name, phone, address and at least one item are required.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let total = 0;
    const lines = [];

    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1) throw Object.assign(new Error('Invalid quantity.'), { status: 400 });
      const [rows] = await conn.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
      const p = rows[0];
      if (!p) throw Object.assign(new Error('A product in your cart no longer exists.'), { status: 400 });
      if (p.stock < qty)
        throw Object.assign(new Error(`Only ${p.stock} left of "${p.name}".`), { status: 400 });
      total += Number(p.price) * qty;
      lines.push({ id: p.id, qty, price: p.price });
    }

    const [result] = await conn.query(
      'INSERT INTO orders (customer_name, phone, address, total) VALUES (?, ?, ?, ?)',
      [customer_name, phone, address, total]);

    for (const l of lines) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [result.insertId, l.id, l.qty, l.price]);
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [l.qty, l.id]);
    }

    await conn.commit();
    res.status(201).json({ order_id: result.insertId, total });
  } catch (e) {
    await conn.rollback();
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  } finally {
    conn.release();
  }
});

// Track an order: needs order ID + the phone number used at checkout
router.get('/:id', async (req, res, next) => {
  try {
    const { phone } = req.query;
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ? AND phone = ?', [req.params.id, phone || '']);
    if (!orders.length) return res.status(404).json({ error: 'No order found with that ID and phone number.' });
    const [items] = await db.query(
      `SELECT oi.quantity, oi.price, p.name, p.image_url
       FROM order_items oi JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`, [req.params.id]);
    res.json({ ...orders[0], items });
  } catch (e) { next(e); }
});

// Shop owner updates status. Send header: x-admin-key: <ADMIN_KEY from .env>
router.put('/:id/status', async (req, res, next) => {
  try {
    if (req.header('x-admin-key') !== process.env.ADMIN_KEY)
      return res.status(401).json({ error: 'Not authorised.' });
    const { status } = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated.' });
  } catch (e) { next(e); }
});

module.exports = router;

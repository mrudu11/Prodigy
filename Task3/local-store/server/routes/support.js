const router = require('express').Router();
const db = require('../db');

router.post('/', async (req, res, next) => {
  try {
    const { name, contact, message } = req.body;
    if (!name || !contact || !message)
      return res.status(400).json({ error: 'Please fill in all fields.' });
    await db.query('INSERT INTO support_messages (name, contact, message) VALUES (?, ?, ?)', [name, contact, message]);
    res.status(201).json({ message: 'Thanks, we will get back to you soon.' });
  } catch (e) { next(e); }
});

module.exports = router;

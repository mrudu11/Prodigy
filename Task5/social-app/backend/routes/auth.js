const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { required } = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({
  id: u.id, username: u.username, display_name: u.display_name,
  bio: u.bio, avatar_url: u.avatar_url,
});

router.post('/register', async (req, res) => {
  const { username, email, password, display_name } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Username, email and password are required' });
  if (!/^\w{3,30}$/.test(username))
    return res.status(400).json({ error: 'Username must be 3-30 letters, numbers or underscores' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const [exists] = await db.query('SELECT id FROM users WHERE username=? OR email=?', [username, email]);
  if (exists.length) return res.status(409).json({ error: 'Username or email is already taken' });

  const hash = await bcrypt.hash(password, 10);
  const [r] = await db.query(
    'INSERT INTO users (username,email,password_hash,display_name) VALUES (?,?,?,?)',
    [username, email, hash, display_name || username]
  );
  const [[user]] = await db.query('SELECT * FROM users WHERE id=?', [r.insertId]);
  res.status(201).json({ token: sign(user.id), user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // username or email
  const [[user]] = await db.query('SELECT * FROM users WHERE username=? OR email=?', [identifier, identifier]);
  if (!user || !(await bcrypt.compare(password || '', user.password_hash)))
    return res.status(401).json({ error: 'Incorrect username or password' });
  res.json({ token: sign(user.id), user: publicUser(user) });
});

router.get('/me', required, async (req, res) => {
  const [[user]] = await db.query('SELECT * FROM users WHERE id=?', [req.userId]);
  if (!user) return res.status(401).json({ error: 'Account not found' });
  res.json({ user: publicUser(user) });
});

module.exports = router;

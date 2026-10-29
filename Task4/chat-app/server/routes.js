const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const { sign, requireAuth } = require('./auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (_req, file, cb) =>
    cb(null, crypto.randomBytes(12).toString('hex') + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const isMember = async (roomId, userId) => {
  const [rows] = await db.query('SELECT 1 FROM chat_members WHERE room_id=? AND user_id=?', [roomId, userId]);
  return rows.length > 0;
};

/* ---------- Auth ---------- */
router.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username || ''))
    return res.status(400).json({ error: 'Username must be 3–30 letters, numbers or underscores' });
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);
    await db.query(
      "INSERT IGNORE INTO chat_members (room_id, user_id) SELECT id, ? FROM chattype WHERE name='General' AND type='group'",
      [r.insertId]
    );
    const user = { id: r.insertId, username };
    res.json({ token: sign(user), user });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That username is taken' });
    console.error(e);
    res.status(500).json({ error: 'Could not create account' });
  }
});

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await db.query('SELECT * FROM users WHERE username=?', [username]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password || '', u.password_hash)))
    return res.status(401).json({ error: 'Wrong username or password' });
  const user = { id: u.id, username: u.username };
  res.json({ token: sign(user), user });
});

router.get('/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

/* ---------- Users ---------- */
router.get('/users', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT id, username FROM users WHERE id<>? ORDER BY username', [req.user.id]);
  res.json(rows);
});

/* ---------- Rooms ---------- */
router.get('/rooms', requireAuth, async (req, res) => {
  const me = req.user.id;
  const [rows] = await db.query(
    `SELECT r.id, r.type,
       IF(r.type='private',
          (SELECT u.username FROM chat_members m JOIN users u ON u.id=m.user_id WHERE m.room_id=r.id AND m.user_id<>?),
          r.name) AS name,
       IF(r.type='private',
          (SELECT m.user_id FROM chat_members m WHERE m.room_id=r.id AND m.user_id<>?), NULL) AS peer_id
     FROM chattype r JOIN chat_members rm ON rm.room_id=r.id AND rm.user_id=?
     ORDER BY r.id DESC`,
    [me, me, me]
  );
  res.json(rows);
});

router.get('/rooms/discover', requireAuth, async (req, res) => {
  const [rows] = await db.query(
    `SELECT id, name FROM chattype WHERE type='group'
     AND id NOT IN (SELECT room_id FROM chat_members WHERE user_id=?) ORDER BY name`,
    [req.user.id]
  );
  res.json(rows);
});

router.post('/rooms', requireAuth, async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name || name.length > 60) return res.status(400).json({ error: 'Room name is required (max 60 characters)' });
  const [r] = await db.query("INSERT INTO chattype (name, type, created_by) VALUES (?, 'group', ?)", [name, req.user.id]);
  await db.query('INSERT INTO chat_members (room_id, user_id) VALUES (?, ?)', [r.insertId, req.user.id]);
  req.app.get('io').in('user:' + req.user.id).socketsJoin('room:' + r.insertId);
  res.json({ id: r.insertId, name, type: 'group' });
});

router.post('/rooms/:id/join', requireAuth, async (req, res) => {
  const [rooms] = await db.query("SELECT id FROM chattype WHERE id=? AND type='group'", [req.params.id]);
  if (!rooms.length) return res.status(404).json({ error: 'Room not found' });
  await db.query('INSERT IGNORE INTO chat_members (room_id, user_id) VALUES (?, ?)', [req.params.id, req.user.id]);
  req.app.get('io').in('user:' + req.user.id).socketsJoin('room:' + req.params.id);
  res.json({ ok: true });
});

router.post('/rooms/private', requireAuth, async (req, res) => {
  const me = req.user.id;
  const peer = Number(req.body.userId);
  if (!peer || peer === me) return res.status(400).json({ error: 'Pick another user' });
  const [target] = await db.query('SELECT id FROM users WHERE id=?', [peer]);
  if (!target.length) return res.status(404).json({ error: 'User not found' });

  const [existing] = await db.query(
    `SELECT r.id FROM chattype r
     JOIN chat_members a ON a.room_id=r.id AND a.user_id=?
     JOIN chat_members b ON b.room_id=r.id AND b.user_id=?
     WHERE r.type='private'`,
    [me, peer]
  );
  if (existing.length) return res.json({ id: existing[0].id });

  const [r] = await db.query("INSERT INTO chattype (type, created_by) VALUES ('private', ?)", [me]);
  await db.query('INSERT INTO chat_members (room_id, user_id) VALUES (?, ?), (?, ?)', [r.insertId, me, r.insertId, peer]);
  const io = req.app.get('io');
  for (const uid of [me, peer]) {
    io.in('user:' + uid).socketsJoin('room:' + r.insertId);
    io.to('user:' + uid).emit('room:added');
  }
  res.json({ id: r.insertId });
});

/* ---------- Chat history ---------- */
router.get('/rooms/:id/messages', requireAuth, async (req, res) => {
  if (!(await isMember(req.params.id, req.user.id))) return res.status(403).json({ error: 'Not a member' });
  const before = Number(req.query.before) || 2147483647;
  const [rows] = await db.query(
    `SELECT m.*, u.username FROM messages m JOIN users u ON u.id=m.user_id
     WHERE m.room_id=? AND m.id<? ORDER BY m.id DESC LIMIT 50`,
    [req.params.id, before]
  );
  res.json(rows.reverse());
});

/* ---------- File sharing ---------- */
router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  res.json({ url: '/uploads/' + req.file.filename, name: req.file.originalname, type: req.file.mimetype });
});

module.exports = router;

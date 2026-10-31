const router = require('express').Router();
const db = require('../db');
const upload = require('../middleware/upload');
const notify = require('../lib/notify');
const { required, optional } = require('../middleware/auth');

// People to follow (must be declared before /:username)
router.get('/', required, async (req, res) => {
  const [rows] = await db.query(
    `SELECT id, username, display_name, avatar_url FROM users
     WHERE id<>? AND id NOT IN (SELECT following_id FROM follows WHERE follower_id=?)
     ORDER BY created_at DESC LIMIT 5`,
    [req.userId, req.userId]
  );
  res.json(rows);
});

// People I follow
router.get('/following', required, async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.username, u.display_name, u.avatar_url
     FROM follows f
     JOIN users u ON u.id=f.following_id
     WHERE f.follower_id=?
     ORDER BY f.created_at DESC`,
    [req.userId]
  );
  res.json(rows);
});

// Followers and followed accounts for a profile
router.get('/:username/:list', async (req, res) => {
  const { username, list } = req.params;
  if (list !== 'followers' && list !== 'following') {
    return res.status(404).json({ error: 'List not found' });
  }

  const [[profile]] = await db.query('SELECT id FROM users WHERE username=?', [username]);
  if (!profile) return res.status(404).json({ error: 'User not found' });

  const relationColumn = list === 'followers' ? 'following_id' : 'follower_id';
  const personColumn = list === 'followers' ? 'follower_id' : 'following_id';
  const [rows] = await db.query(
    `SELECT u.id, u.username, u.display_name, u.avatar_url
     FROM follows f
     JOIN users u ON u.id=f.${personColumn}
     WHERE f.${relationColumn}=?
     ORDER BY f.created_at DESC`,
    [profile.id]
  );
  res.json(rows);
});

// Update my profile
router.put('/me/profile', required, upload.single('avatar'), async (req, res) => {
  const { display_name, bio } = req.body;
  const avatar = req.file ? `/uploads/${req.file.filename}` : null;
  await db.query(
    'UPDATE users SET display_name=COALESCE(?,display_name), bio=COALESCE(?,bio), avatar_url=COALESCE(?,avatar_url) WHERE id=?',
    [display_name || null, bio ?? null, avatar, req.userId]
  );
  const [[user]] = await db.query(
    'SELECT id,username,display_name,bio,avatar_url FROM users WHERE id=?', [req.userId]);
  res.json({ user });
});

// Follow / unfollow (toggle)
router.post('/:id/follow', required, async (req, res) => {
  const target = Number(req.params.id);
  if (target === req.userId) return res.status(400).json({ error: "You can't follow yourself" });
  const [del] = await db.query('DELETE FROM follows WHERE follower_id=? AND following_id=?', [req.userId, target]);
  if (del.affectedRows) return res.json({ following: false });
  await db.query('INSERT INTO follows (follower_id, following_id) VALUES (?,?)', [req.userId, target]);
  await notify(target, req.userId, 'follow');
  res.json({ following: true });
});

// Profile (public)
router.get('/:username', optional, async (req, res) => {
  const [[u]] = await db.query(
    `SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url, u.created_at,
      (SELECT COUNT(*) FROM follows WHERE following_id=u.id) followers,
      (SELECT COUNT(*) FROM follows WHERE follower_id=u.id) following,
      (SELECT COUNT(*) FROM posts WHERE user_id=u.id) posts,
      EXISTS(SELECT 1 FROM follows WHERE follower_id=? AND following_id=u.id) is_following
     FROM users u WHERE u.username=?`,
    [req.userId, req.params.username]
  );
  if (!u) return res.status(404).json({ error: 'User not found' });
  u.is_following = !!u.is_following;
  res.json(u);
});

module.exports = router;

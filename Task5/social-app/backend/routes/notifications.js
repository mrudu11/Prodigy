const router = require('express').Router();
const db = require('../db');
const { required } = require('../middleware/auth');

router.get('/', required, async (req, res) => {
  const [rows] = await db.query(
    `SELECT n.id, n.type, n.post_id, n.is_read, n.created_at,
            u.username, u.display_name, u.avatar_url
     FROM notifications n JOIN users u ON u.id=n.actor_id
     WHERE n.user_id=? ORDER BY n.created_at DESC LIMIT 50`, [req.userId]);
  res.json(rows);
});

router.get('/unread-count', required, async (req, res) => {
  const [[{ n }]] = await db.query(
    'SELECT COUNT(*) n FROM notifications WHERE user_id=? AND is_read=0', [req.userId]);
  res.json({ count: n });
});

router.post('/read', required, async (req, res) => {
  await db.query('UPDATE notifications SET is_read=1 WHERE user_id=?', [req.userId]);
  res.json({ ok: true });
});

module.exports = router;

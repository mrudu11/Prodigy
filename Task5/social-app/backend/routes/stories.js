const router = require('express').Router();
const db = require('../db');
const upload = require('../middleware/upload');
const { required, optional } = require('../middleware/auth');

router.get('/', optional, async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.id, s.user_id, s.media_url, s.media_type, s.created_at, s.expires_at,
      u.username, u.display_name, u.avatar_url
     FROM stories s
     JOIN users u ON u.id=s.user_id
     WHERE s.expires_at > NOW()
       AND (?=0 OR s.user_id=? OR EXISTS(
         SELECT 1 FROM follows f WHERE f.follower_id=? AND f.following_id=s.user_id
       ))
     ORDER BY s.user_id, s.created_at`,
    [req.userId, req.userId, req.userId]
  );
  res.json(rows);
});

router.post('/', required, upload.single('media'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Choose an image or video for your story' });
  }

  const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  const [result] = await db.query(
    'INSERT INTO stories (user_id, media_url, media_type, expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 24 HOUR))',
    [req.userId, `/uploads/${req.file.filename}`, mediaType]
  );
  const [[story]] = await db.query(
    `SELECT s.id, s.user_id, s.media_url, s.media_type, s.created_at, s.expires_at,
      u.username, u.display_name, u.avatar_url
     FROM stories s JOIN users u ON u.id=s.user_id WHERE s.id=?`,
    [result.insertId]
  );
  res.status(201).json(story);
});

module.exports = router;

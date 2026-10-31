const router = require('express').Router();
const db = require('../db');
const upload = require('../middleware/upload');
const notify = require('../lib/notify');
const { required, optional } = require('../middleware/auth');

const SELECT = `
  SELECT p.id, p.content, p.media_url, p.media_type, p.created_at,
    u.id AS user_id, u.username, u.display_name, u.avatar_url,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id=p.id) AS like_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) AS comment_count,
    EXISTS(SELECT 1 FROM likes l WHERE l.post_id=p.id AND l.user_id=?) AS liked_by_me,
    (SELECT GROUP_CONCAT(t.name) FROM post_tags pt JOIN tags t ON t.id=pt.tag_id WHERE pt.post_id=p.id) AS tags
  FROM posts p JOIN users u ON u.id=p.user_id`;

const shape = (r) => ({ ...r, liked_by_me: !!r.liked_by_me, tags: r.tags ? r.tags.split(',') : [] });

// Feed: ?feed=following | ?sort=trending | ?tag=name | ?user=username  (&page=1)
router.get('/', optional, async (req, res) => {
  const { feed, sort, tag, user } = req.query;
  const limit = 10;
  const offset = (Math.max(Number(req.query.page) || 1, 1) - 1) * limit;
  const where = [], params = [req.userId];

  if (feed === 'following') {
    where.push('(p.user_id IN (SELECT following_id FROM follows WHERE follower_id=?) OR p.user_id=?)');
    params.push(req.userId, req.userId);
  }
  if (tag) {
    where.push('p.id IN (SELECT pt.post_id FROM post_tags pt JOIN tags t ON t.id=pt.tag_id WHERE t.name=?)');
    params.push(String(tag).toLowerCase());
  }
  if (user) { where.push('u.username=?'); params.push(user); }
  if (sort === 'trending') where.push('p.created_at > NOW() - INTERVAL 30 DAY');

  const order = sort === 'trending'
    ? 'ORDER BY (like_count*2 + comment_count) DESC, p.created_at DESC'
    : 'ORDER BY p.created_at DESC';

  const [rows] = await db.query(
    `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  res.json(rows.map(shape));
});

// Trending tags (last 14 days)
router.get('/trending/tags', async (req, res) => {
  const [rows] = await db.query(
    `SELECT t.name, COUNT(*) AS uses FROM post_tags pt
     JOIN tags t ON t.id=pt.tag_id JOIN posts p ON p.id=pt.post_id
     WHERE p.created_at > NOW() - INTERVAL 14 DAY
     GROUP BY t.id, t.name ORDER BY uses DESC LIMIT 8`
  );
  res.json(rows);
});

// Create post (text + optional image/video + tags)
router.post('/', required, upload.single('media'), async (req, res) => {
  const content = (req.body.content || '').trim();
  if (!content && !req.file) return res.status(400).json({ error: 'Write something or add a photo or video' });

  const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const mediaType = req.file ? (req.file.mimetype.startsWith('video') ? 'video' : 'image') : null;

  const [r] = await db.query(
    'INSERT INTO posts (user_id, content, media_url, media_type) VALUES (?,?,?,?)',
    [req.userId, content || null, mediaUrl, mediaType]
  );

  // Tags come from #hashtags in the text and an optional comma-separated "tags" field
  const fromText = [...content.matchAll(/#(\w{1,40})/g)].map((m) => m[1]);
  const fromField = (req.body.tags || '').split(',').map((t) => t.replace(/^#/, '').trim());
  const tags = [...new Set([...fromText, ...fromField].filter(Boolean).map((t) => t.toLowerCase()))].slice(0, 10);

  for (const name of tags) {
    await db.query('INSERT IGNORE INTO tags (name) VALUES (?)', [name]);
    const [[tag]] = await db.query('SELECT id FROM tags WHERE name=?', [name]);
    await db.query('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?,?)', [r.insertId, tag.id]);
  }

  const [[post]] = await db.query(`${SELECT} WHERE p.id=?`, [req.userId, r.insertId]);
  res.status(201).json(shape(post));
});

router.delete('/:id', required, async (req, res) => {
  const [r] = await db.query('DELETE FROM posts WHERE id=? AND user_id=?', [req.params.id, req.userId]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Post not found' });
  res.json({ ok: true });
});

// Like / unlike (toggle)
router.post('/:id/like', required, async (req, res) => {
  const postId = Number(req.params.id);
  const [[post]] = await db.query('SELECT user_id FROM posts WHERE id=?', [postId]);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const [del] = await db.query('DELETE FROM likes WHERE user_id=? AND post_id=?', [req.userId, postId]);
  let liked = false;
  if (!del.affectedRows) {
    await db.query('INSERT INTO likes (user_id, post_id) VALUES (?,?)', [req.userId, postId]);
    await notify(post.user_id, req.userId, 'like', postId);
    liked = true;
  }
  const [[{ n }]] = await db.query('SELECT COUNT(*) n FROM likes WHERE post_id=?', [postId]);
  res.json({ liked, like_count: n });
});

// Comments
router.get('/:id/comments', async (req, res) => {
  const [rows] = await db.query(
    `SELECT c.id, c.content, c.created_at, u.username, u.display_name, u.avatar_url
     FROM comments c JOIN users u ON u.id=c.user_id
     WHERE c.post_id=? ORDER BY c.created_at ASC`, [req.params.id]);
  res.json(rows);
});

router.post('/:id/comments', required, async (req, res) => {
  const content = (req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: 'Comment cannot be empty' });
  const postId = Number(req.params.id);
  const [[post]] = await db.query('SELECT user_id FROM posts WHERE id=?', [postId]);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const [r] = await db.query('INSERT INTO comments (post_id, user_id, content) VALUES (?,?,?)',
    [postId, req.userId, content.slice(0, 500)]);
  await notify(post.user_id, req.userId, 'comment', postId);
  const [[c]] = await db.query(
    `SELECT c.id, c.content, c.created_at, u.username, u.display_name, u.avatar_url
     FROM comments c JOIN users u ON u.id=c.user_id WHERE c.id=?`, [r.insertId]);
  res.status(201).json(c);
});

module.exports = router;

const db = require('../db');

// Skips notifications for your own actions; ignores duplicate likes/follows.
module.exports = async function notify(userId, actorId, type, postId = null) {
  if (userId === actorId) return;
  if (type !== 'comment') {
    const [rows] = await db.query(
      'SELECT id FROM notifications WHERE user_id=? AND actor_id=? AND type=? AND post_id <=> ?',
      [userId, actorId, type, postId]
    );
    if (rows.length) return;
  }
  await db.query(
    'INSERT INTO notifications (user_id, actor_id, type, post_id) VALUES (?,?,?,?)',
    [userId, actorId, type, postId]
  );
};

const jwt = require('jsonwebtoken');

const sign = (user) =>
  jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

const verify = (token) => jwt.verify(token, process.env.JWT_SECRET);

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.user = verify(token);
    next();
  } catch {
    res.status(401).json({ error: 'Please log in again' });
  }
}

module.exports = { sign, verify, requireAuth };

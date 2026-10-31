const jwt = require('jsonwebtoken');

function read(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try { return jwt.verify(h.slice(7), process.env.JWT_SECRET).id; } catch { return null; }
}

exports.required = (req, res, next) => {
  const id = read(req);
  if (!id) return res.status(401).json({ error: 'Please log in' });
  req.userId = id;
  next();
};

exports.optional = (req, res, next) => {
  req.userId = read(req) || 0;
  next();
};

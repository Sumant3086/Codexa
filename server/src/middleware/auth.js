const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ajaia-dev-secret-change-in-prod';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };

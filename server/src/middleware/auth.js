const crypto = require('crypto');

// In-memory token store: token -> expiry timestamp
const tokens = new Map();

function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, Date.now() + 12 * 60 * 60 * 1000); // 12h
  return token;
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Ej autentiserad' });
  const token = auth.slice(7);
  const expiry = tokens.get(token);
  if (!expiry || Date.now() > expiry) return res.status(401).json({ error: 'Session utgången, logga in igen' });
  next();
}

module.exports = { generateToken, requireAuth };

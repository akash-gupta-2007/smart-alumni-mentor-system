const jwt = require('jsonwebtoken');
const SECRET = () => process.env.JWT_SECRET || 'dev_secret_change_me_32_chars_min';
// Short-lived access tokens (SaaS default 15m) + long-lived refresh tokens (30d, rotated server-side).
function sign(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, SECRET(), { expiresIn: process.env.ACCESS_EXPIRES || '15m' });
}
function signRefresh(user) {
  const { v4: uuid } = require('uuid');
  // jti nonce: two tokens minted in the same second must still differ,
  // otherwise rotation can return an identical (already-seen) token string.
  return jwt.sign({ id: user.id, typ: 'refresh', jti: uuid() }, SECRET(), { expiresIn: process.env.REFRESH_EXPIRES || '30d' });
}
function verifyRefresh(token) {
  const p = jwt.verify(token, SECRET());
  if (p.typ !== 'refresh' || !p.id) throw new Error('not a refresh token');
  return p;
}
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try { req.user = jwt.verify(token, SECRET()); next(); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }
}
function allow(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden: role ' + (req.user?.role || '?') });
    next();
  };
}
module.exports = { sign, signRefresh, verifyRefresh, auth, allow };

const jwt = require('jsonwebtoken');
function sign(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'dev_secret_change_me_32_chars_min', { expiresIn: process.env.JWT_EXPIRES || '7d' });
}
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me_32_chars_min'); next(); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }
}
function allow(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden: role ' + (req.user?.role || '?') });
    next();
  };
}
module.exports = { sign, auth, allow };

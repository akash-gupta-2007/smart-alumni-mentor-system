const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { q, one } = require('../config/db');
const { sign } = require('../middleware/auth');
const { v, schemas } = require('../middleware/validate');
const { audit } = require('../middleware/audit');
const r = express.Router();

// POST /api/auth/register — student/alumni self-onboarding (coordinator seeded via SQL*Plus)
r.post('/register', v(schemas.register), async (req, res) => {
  const { email, password, full_name, role, languages } = req.body;
  try {
    const exists = await one('SELECT id FROM users WHERE email = :email', { email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12); // bcrypt-12, never MD5/SHA1
    const id = uuid();
    await q(`INSERT INTO users (id, email, password_hash, role, full_name, languages, consent_given)
             VALUES (:id, :email, :hash, :role, :name, :langs, 1)`,
      { id, email: email.toLowerCase(), hash, role, name: full_name, langs: JSON.stringify(languages) });
    if (role === 'student') {
      await q(`INSERT INTO student_profiles (user_id, enrollment_no, department, study_year, goals, domain_interests)
               VALUES (:id, :enr, 'IT', 3, :goals, :domains)`,
        { id, enr: 'ENR-' + id.slice(0, 8).toUpperCase(), goals: JSON.stringify({ primary: 'placement' }), domains: JSON.stringify(['Web Dev']) });
    } else {
      await q(`INSERT INTO alumni_profiles (user_id, graduation_year, expertise_tags, max_mentees)
               VALUES (:id, 2022, :tags, 5)`, { id, tags: JSON.stringify(['Web Dev', 'DevOps']) });
    }
    await audit(id, 'AUTH.REGISTER', 'users', id, { role }, req.ip);
    res.status(201).json({ id, token: sign({ id, role, email }) });
  } catch (e) {
    if (e.errorNum === 1) return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Register failed' });
  }
});

// POST /api/auth/login — generic errors (no user enumeration) + DB-backed lockout
r.post('/login', v(schemas.login), async (req, res) => {
  const { email, password } = req.body;
  const mail = String(email).toLowerCase();
  try {
    const lock = await one('SELECT mentor_sec.fn_is_locked(:email) AS locked FROM DUAL', { email: mail });
    if (lock && Number(lock.locked) === 1) {
      await audit(null, 'AUTH.LOCKED', 'users', null, { email: mail }, req.ip);
      return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
    }
    const u = await one('SELECT id, email, password_hash, role, full_name FROM users WHERE email = :email AND is_active = 1', { email: mail });
    const ok = u && await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      // constant-shape failure: attacker learns nothing (no "user not found" vs "wrong password")
      await q('BEGIN mentor_sec.proc_reg_fail(:email, :ip); END;', { email: mail, ip: req.ip || null });
      await audit(null, 'AUTH.FAIL', 'users', null, { email: mail }, req.ip);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    await q('BEGIN mentor_sec.proc_reg_success(:email); END;', { email: mail });
    await audit(u.id, 'AUTH.LOGIN', 'users', u.id, {}, req.ip);
    res.json({ token: sign(u), user: { id: u.id, role: u.role, full_name: u.full_name, email: u.email } });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me — never returns password_hash (column allowlist)
const { auth } = require('../middleware/auth');
r.get('/me', auth, async (req, res) => {
  const me = await one('SELECT id, email, role, full_name, languages FROM users WHERE id = :id', { id: req.user.id });
  res.json(me || null);
});
// POST /api/auth/logout — client discards JWT; server records the audit event
r.post('/logout', auth, async (req, res) => {
  await audit(req.user.id, 'AUTH.LOGOUT', 'users', req.user.id, {}, req.ip);
  res.json({ ok: true });
});
module.exports = r;

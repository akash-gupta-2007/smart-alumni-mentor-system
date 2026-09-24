// Oracle thin-mode pool (no Oracle Client install needed).
// ANTI-SQL-INJECTION: every query goes through q() with BIND variables only.
// SQL text is always a constant — user input NEVER concatenated into SQL.
const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat = oracledb.OBJECT;          // rows as objects
oracledb.fetchAsString = [oracledb.CLOB];      // JSON CLOBs arrive as strings

let pool = null;
async function getPool() {
  if (!pool) {
    pool = await oracledb.createPool({
      user: process.env.DB_USER || 'mentor_app',           // least-privilege user, NEVER system
      password: process.env.DB_PASSWORD || '',
      connectString: process.env.ORACLE_CONNECT || 'localhost/XEPDB1',
      poolMin: 2, poolMax: 10, poolIncrement: 1
    });
  }
  return pool;
}

// q(sql, binds): sql must be a literal with :named binds. No template ${} allowed.
async function q(sql, binds = {}) {
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    const res = await conn.execute(sql, binds, { autoCommit: true });
    return lower(res.rows || []);
  } finally { await conn.close(); }
}
async function one(sql, binds = {}) {
  const rows = await q(sql, binds);
  return rows[0] || null;
}
// Oracle returns UPPERCASE keys — normalize once, here.
function lower(rows) {
  return rows.map(o => Object.fromEntries(
    Object.entries(o).map(([k, v]) => [k.toLowerCase(), v === undefined ? null : v])
  ));
}
// JSON CLOB columns arrive as strings — parse safely.
function J(s, fb = []) {
  try { return typeof s === 'string' ? JSON.parse(s) : (s ?? fb); }
  catch { return fb; }
}
function bit(n) { return Number(n) === 1; }

async function ping() {
  try { await q('SELECT 1 AS ok FROM DUAL'); return true; }
  catch { return false; }
}
async function closePool() {
  if (pool) { try { await pool.close(5); } catch { /* already closed */ } pool = null; }
}
module.exports = { q, one, J, bit, ping, closePool };

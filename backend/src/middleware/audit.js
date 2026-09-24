const { q } = require('../config/db');
// Append-only audit via PL/SQL (autonomous txn: survives caller rollback).
// Fire-and-forget: audit must never break or delay the API response.
async function audit(actor, action, entity, entity_id, meta, ip) {
  try {
    let metaStr = null;
    if (meta !== undefined && meta !== null) {
      metaStr = JSON.stringify(meta).slice(0, 2000);
      JSON.parse(metaStr); // guarantee IS JSON so the CHECK never rejects the audit
    }
    await q('BEGIN mentor_sec.proc_audit(:actor, :action, :entity, :eid, :meta, :ip); END;',
      { actor: actor || null, action, entity, eid: entity_id ? String(entity_id).slice(0, 60) : null, meta: metaStr, ip: ip || null });
  } catch { /* audit must not crash API */ }
}
module.exports = { audit };

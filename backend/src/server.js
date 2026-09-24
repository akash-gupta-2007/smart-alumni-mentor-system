require('dotenv').config();
const app = require('./app');
const { closePool } = require('./config/db');
const PORT = +(process.env.PORT || 4000);
const server = app.listen(PORT, () => console.log(`✅ mentor-market API :${PORT} | health /health | ready /ready | metrics /metrics`));
// SaaS reliability: drain connections on shutdown instead of dropping them.
function shutdown(sig) {
  console.log(`${sig} received — draining…`);
  server.close(async () => { await closePool(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

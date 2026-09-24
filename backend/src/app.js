const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const client = require('prom-client');
require('dotenv').config();

const app = express();
app.disable('x-powered-by'); // hide stack fingerprint
app.set('trust proxy', 1);   // correct IPs for rate-limit behind proxy
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], objectSrc: ["'none'"] } },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  crossOriginEmbedderPolicy: false // allow Vite dev proxy
}));
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '100kb' }));
app.use(morgan('combined'));

// brute-force + abuse guard (login strict, api general)
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true }));
app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 200, standardHeaders: true }));

// request-id tracing (no PII in logs)
app.use((req, res, next) => {
  req.id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  res.setHeader('X-Request-Id', req.id);
  next();
});

// telemetry
const collectDefault = client.collectDefaultMetrics;
collectDefault();
const httpHist = new client.Histogram({ name: 'http_duration_seconds', help: 'API latency', labelNames: ['method', 'route', 'code'] });
const matchHist = new client.Histogram({ name: 'match_duration_seconds', help: 'Matching engine execution time', buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2] });
app.use((req, res, next) => {
  const t = Date.now();
  res.on('finish', () => {
    const s = (Date.now() - t) / 1000;
    httpHist.labels(req.method, req.path, res.statusCode).observe(s);
    if (req.path.startsWith('/suggest/')) matchHist.observe(s);
  });
  next();
});

app.get('/health', async (req, res) => {
  const { ping } = require('./config/db');
  res.json({ ok: true, db: (await ping()) ? 'up' : 'down', time: new Date().toISOString() });
});
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

// openapi pointer
app.get('/openapi.yaml', (req, res) => res.sendFile('openapi.yaml', { root: '..' }));

// 404 JSON (no stack, no path echo beyond route)
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// fail-safe + privacy: never leak stack or PII
// eslint-disable-next-line
app.use((err, req, res, next) => {
  console.error(JSON.stringify({ err: err.message, url: req.originalUrl, trace: req.id }));
  res.status(500).json({ error: 'Internal error' });
});
module.exports = app;

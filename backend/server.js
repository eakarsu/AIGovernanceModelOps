const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const { authenticateToken, requireWriteRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 3041;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3040,http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

// File upload route reads its own multipart body — skip JSON parsing for it.
app.use((req, res, next) => {
  if (req.path === '/api/attachments/upload') return next();
  return express.json({ limit: '20mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.path === '/api/attachments/upload') return next();
  return express.urlencoded({ extended: true, limit: '20mb' })(req, res, next);
});

// Health (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth (public for login; /me is protected internally)
app.use('/api/auth', require('./routes/auth'));

// All /api/* routes below this line require a valid JWT
app.use('/api', authenticateToken);
// Role gate (auditors are read-only across all write methods)
app.use('/api', requireWriteRole);

// Routes — original 8 CRUD features
app.use('/api/models', require('./routes/models'));
app.use('/api/datasets', require('./routes/datasets'));
app.use('/api/evaluations', require('./routes/evaluations'));
app.use('/api/deployments', require('./routes/deployments'));
app.use('/api/audit-logs', require('./routes/audit_logs'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/risk-register', require('./routes/risk_register'));

// New CRUD — 10 entities
app.use('/api/model-cards',       require('./routes/model_cards'));
app.use('/api/prompts',           require('./routes/prompts'));
app.use('/api/ssp',               require('./routes/ssp'));
app.use('/api/dpia-records',      require('./routes/dpia_records'));
app.use('/api/redteam-findings',  require('./routes/redteam_findings'));
app.use('/api/third-parties',     require('./routes/third_parties'));
app.use('/api/training-runs',     require('./routes/training_runs'));
app.use('/api/fine-tunes',        require('./routes/fine_tunes'));
app.use('/api/controls',          require('./routes/controls'));
app.use('/api/jurisdictions',     require('./routes/jurisdictions'));

// AI routes — 6 original + 10 new endpoints under /api/ai
app.use('/api/ai', require('./routes/ai'));

// Dashboard
app.use('/api/dashboard', require('./routes/dashboard'));

// Cross-cutting
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments',   require('./routes/attachments'));
app.use('/api/webhooks',      require('./routes/webhooks'));

// MLGov Custom Views (mounted BEFORE any 404 fallthrough)
app.use('/api/custom-views',  require('./routes/customViews'));

// 404 fallthrough for unknown /api paths
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));

// Global error nets (helps surface why the process would otherwise die silently)
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.stack || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason && reason.stack || reason);
});

app.listen(PORT, () => {
  console.log(`\nAI Governance ModelOps API running on http://localhost:${PORT}\n`);
});

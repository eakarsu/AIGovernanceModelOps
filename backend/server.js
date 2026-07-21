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

// The legacy generic CRUD/AI/backlog routes are intentionally not mounted until
// they have tenant ownership, immutable evidence, and safe external adapters.
app.use('/api/governance-workflow', require('./routes/governanceWorkflow'));

// 404 fallthrough for unknown /api paths
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\nAI Governance ModelOps API running on http://localhost:${PORT}\n`);
  });
}

module.exports = app;

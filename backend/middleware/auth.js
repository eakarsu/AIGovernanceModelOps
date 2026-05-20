const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'ai-governance-modelops-secret-key-2026';

// Read-only methods that auditors are allowed to use
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Roles:
//   admin     – full access
//   officer   – full access (can edit), can override audit-trail
//   auditor   – read-only across everything
//   compliance – legacy role, treated as officer-level
function roleAllows(role, method) {
  if (!role) return false;
  if (role === 'admin' || role === 'officer' || role === 'compliance') return true;
  if (role === 'auditor') return READ_METHODS.has(method);
  return READ_METHODS.has(method);
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Role gate — applied after authenticateToken
const requireWriteRole = (req, res, next) => {
  const method = (req.method || '').toUpperCase();
  if (READ_METHODS.has(method)) return next();
  if (!req.user) return res.status(401).json({ error: 'Auth required' });
  if (!roleAllows(req.user.role, method)) {
    return res.status(403).json({ error: `Role '${req.user.role}' cannot perform ${method} (read-only)` });
  }
  next();
};

// Optional explicit role list
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Auth required' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
  }
  next();
};

module.exports = { authenticateToken, requireWriteRole, requireRole, roleAllows, JWT_SECRET };

const express = require('express');
const pool = require('../config/database');

// The legacy catalog tables contain local sample data and have no tenant key.
// Expose them only in the explicitly enabled development demo, read-only.
const TABLES = Object.freeze({
  models: 'models',
  datasets: 'datasets',
  evaluations: 'evaluations',
  deployments: 'deployments',
  'audit-logs': 'audit_logs',
  policies: 'policies',
  incidents: 'incidents',
  'risk-register': 'risk_register',
  'model-cards': 'model_cards',
  prompts: 'prompts',
  ssp: 'ssp',
  'dpia-records': 'dpia_records',
  'redteam-findings': 'redteam_findings',
  'third-parties': 'third_parties',
  'training-runs': 'training_runs',
  'fine-tunes': 'fine_tunes',
  controls: 'controls',
  jurisdictions: 'jurisdictions',
});

const router = express.Router();

router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_LEGACY_ROUTES !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.user?.tenant_key !== 'default' || !['admin', 'officer', 'auditor', 'compliance'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Local demo catalog access denied' });
  }
  next();
});

router.use('/dashboard', require('./dashboard'));

router.get('/webhooks', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, webhook_id, url, events, active, created_at, updated_at FROM webhooks ORDER BY id DESC LIMIT 500');
    res.json(result.rows);
  } catch (error) {
    console.error('Demo webhook catalog read failed', error);
    res.status(500).json({ error: 'Unable to load demo webhooks' });
  }
});

router.get('/webhooks/deliveries', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, webhook_id, event, status_code, response, signature, delivered_at FROM webhook_deliveries ORDER BY id DESC LIMIT 500');
    res.json(result.rows);
  } catch (error) {
    console.error('Demo webhook delivery read failed', error);
    res.status(500).json({ error: 'Unable to load demo deliveries' });
  }
});

router.get('/approvals', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM approvals ORDER BY id DESC LIMIT 500');
    res.json(result.rows);
  } catch (error) {
    console.error('Demo approval catalog read failed', error);
    res.status(500).json({ error: 'Unable to load demo approvals' });
  }
});

router.get('/approvals/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid record ID' });
  try {
    const result = await pool.query('SELECT * FROM approvals WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Record not found' });
    const history = await pool.query('SELECT * FROM approval_history WHERE approval_id = $1 ORDER BY id', [result.rows[0].approval_id]);
    res.json({ ...result.rows[0], history: history.rows });
  } catch (error) {
    console.error('Demo approval read failed', error);
    res.status(500).json({ error: 'Unable to load demo approval' });
  }
});

router.get('/:resource', async (req, res, next) => {
  const table = Object.hasOwn(TABLES, req.params.resource) ? TABLES[req.params.resource] : null;
  if (!table) return next();
  try {
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 500`);
    res.json(result.rows);
  } catch (error) {
    console.error(`Demo catalog read failed: ${table}`, error);
    res.status(500).json({ error: 'Unable to load demo catalog' });
  }
});

router.get('/:resource/:id', async (req, res, next) => {
  const table = Object.hasOwn(TABLES, req.params.resource) ? TABLES[req.params.resource] : null;
  if (!table) return next();
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid record ID' });
  try {
    const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Demo catalog read failed: ${table}`, error);
    res.status(500).json({ error: 'Unable to load demo record' });
  }
});

module.exports = router;

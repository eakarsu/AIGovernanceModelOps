const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const q = async (sql) => (await pool.query(sql)).rows[0];

    const models = await q(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active,
        COUNT(*) FILTER (WHERE risk_tier IN ('high','unacceptable'))::int AS high_risk
      FROM models
    `);
    const datasets = await q(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE pii_present = true)::int AS pii_present,
        COUNT(*) FILTER (WHERE sensitivity IN ('restricted','confidential','pii'))::int AS sensitive
      FROM datasets
    `);
    const evaluations = await q(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE passed = true)::int AS passed,
        COUNT(*) FILTER (WHERE passed = false)::int AS failed
      FROM evaluations
    `);
    const deployments = await q(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE env = 'production')::int AS production
      FROM deployments
    `);
    const audit_logs = await q(`SELECT COUNT(*)::int AS total FROM audit_logs`);
    const policies = await q(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'published')::int AS published,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft
      FROM policies
    `);
    const incidents = await q(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status != 'closed')::int AS open,
        COUNT(*) FILTER (WHERE severity = 'high')::int AS high_severity
      FROM incidents
    `);
    const risk_register = await q(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE impact = 'high')::int AS high_impact
      FROM risk_register
    `);

    const model_cards     = await q(`SELECT COUNT(*)::int AS total FROM model_cards`);
    const prompts         = await q(`SELECT COUNT(*)::int AS total FROM prompts`);
    const ssp             = await q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='approved')::int AS approved FROM ssp`);
    const dpia            = await q(`SELECT COUNT(*)::int AS total FROM dpia_records`);
    const redteam         = await q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='open')::int AS open FROM redteam_findings`);
    const third_parties   = await q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE dpia_required=true)::int AS dpia_required FROM third_parties`);
    const training_runs   = await q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='complete')::int AS complete FROM training_runs`);
    const fine_tunes      = await q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='promoted')::int AS promoted FROM fine_tunes`);
    const controls        = await q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='implemented')::int AS implemented, COUNT(*) FILTER (WHERE status='missing')::int AS missing FROM controls`);
    const jurisdictions   = await q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='gap')::int AS gaps FROM jurisdictions`);

    res.json({
      models, datasets, evaluations, deployments, audit_logs, policies, incidents, risk_register,
      model_cards, prompts, ssp, dpia, redteam, third_parties, training_runs, fine_tunes, controls, jurisdictions,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

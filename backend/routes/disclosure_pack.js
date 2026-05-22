// Disclosure pack bundler — Apply pass 7
// Bundles model-card + SSP + DPIA + latest bias/drift AI results into a
// single JSON envelope keyed by model_id. No zip/PDF library is used (the
// project has a no-new-deps rule); instead the bundle is a structured JSON
// document a downstream tooling step can render into PDF / zip if needed.
//
// Endpoints:
//   GET  /api/disclosure-pack/:modelId        – JSON envelope (default)
//   GET  /api/disclosure-pack/:modelId?format=text  – plain-text export
const express = require('express');
const pool = require('../config/database');

const router = express.Router();

async function safeQuery(sql, params) {
  try {
    const r = await pool.query(sql, params);
    return r.rows;
  } catch (e) {
    return { _error: e.message, _sql: sql };
  }
}

router.get('/:modelId', async (req, res) => {
  const modelId = String(req.params.modelId || '').trim();
  if (!modelId) return res.status(400).json({ error: 'modelId path param required' });
  const format = String(req.query.format || 'json').toLowerCase();

  try {
    // 1. Model record (registry)
    const modelRows = await safeQuery(
      `SELECT * FROM models WHERE model_id = $1 OR name = $1 LIMIT 1`,
      [modelId]
    );

    // 2. Model card(s)
    const modelCards = await safeQuery(
      `SELECT * FROM model_cards WHERE model = $1 ORDER BY id DESC LIMIT 5`,
      [modelId]
    );

    // 3. SSPs touching this system
    const ssps = await safeQuery(
      `SELECT * FROM ssp WHERE system_name = $1 OR system_name ILIKE $2 ORDER BY id DESC LIMIT 5`,
      [modelId, `%${modelId}%`]
    );

    // 4. DPIA records
    const dpias = await safeQuery(
      `SELECT * FROM dpia_records WHERE system = $1 OR system ILIKE $2 ORDER BY id DESC LIMIT 5`,
      [modelId, `%${modelId}%`]
    );

    // 5. Latest bias audit AI result for this model
    const biasRows = await safeQuery(
      `SELECT id, input, output, created_at FROM ai_results
       WHERE feature = 'audit_bias'
         AND (input->>'model' = $1 OR input->>'model_id' = $1)
       ORDER BY id DESC LIMIT 1`,
      [modelId]
    );

    // 6. Latest drift detection AI result for this model
    const driftRows = await safeQuery(
      `SELECT id, input, output, created_at FROM ai_results
       WHERE feature = 'detect_drift'
         AND (input->>'model' = $1 OR input->>'model_id' = $1)
       ORDER BY id DESC LIMIT 1`,
      [modelId]
    );

    // 7. Most recent evaluations
    const evals = await safeQuery(
      `SELECT * FROM evaluations WHERE model = $1 ORDER BY id DESC LIMIT 10`,
      [modelId]
    );

    // 8. Open incidents
    const incidents = await safeQuery(
      `SELECT * FROM incidents WHERE model = $1 ORDER BY id DESC LIMIT 10`,
      [modelId]
    );

    // 9. Red-team findings
    const redteam = await safeQuery(
      `SELECT * FROM redteam_findings WHERE model = $1 ORDER BY id DESC LIMIT 10`,
      [modelId]
    );

    const bundle = {
      bundle_kind: 'regulator_ready_disclosure_pack',
      bundle_version: '1.0',
      model_id: modelId,
      generated_at: new Date().toISOString(),
      generated_by: req.user?.email || req.user?.id || 'system',
      frameworks: ['EU_AI_Act', 'NIST_AI_RMF', 'ISO_42001'],
      contents: {
        model_registry: modelRows,
        model_cards: modelCards,
        system_security_plans: ssps,
        dpia_records: dpias,
        latest_bias_audit: Array.isArray(biasRows) ? biasRows[0] || null : biasRows,
        latest_drift_analysis: Array.isArray(driftRows) ? driftRows[0] || null : driftRows,
        recent_evaluations: evals,
        open_incidents: incidents,
        redteam_findings: redteam,
      },
      coverage_summary: {
        has_model_card: Array.isArray(modelCards) && modelCards.length > 0,
        has_ssp: Array.isArray(ssps) && ssps.length > 0,
        has_dpia: Array.isArray(dpias) && dpias.length > 0,
        has_bias_audit: Array.isArray(biasRows) && biasRows.length > 0,
        has_drift_analysis: Array.isArray(driftRows) && driftRows.length > 0,
        evaluation_count: Array.isArray(evals) ? evals.length : 0,
        open_incident_count: Array.isArray(incidents) ? incidents.length : 0,
        redteam_finding_count: Array.isArray(redteam) ? redteam.length : 0,
      },
    };

    if (format === 'text') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="disclosure-pack-${modelId}.txt"`);
      return res.send(renderText(bundle));
    }

    // Default JSON envelope (acts as the bundle file — caller may save to disk)
    res.setHeader('Content-Disposition', `attachment; filename="disclosure-pack-${modelId}.json"`);
    res.json(bundle);
  } catch (e) {
    console.error('[disclosure-pack]', e.message);
    res.status(500).json({ error: e.message });
  }
});

function renderText(bundle) {
  const lines = [];
  lines.push('REGULATOR-READY DISCLOSURE PACK');
  lines.push(`Model: ${bundle.model_id}`);
  lines.push(`Generated: ${bundle.generated_at}`);
  lines.push(`Frameworks: ${(bundle.frameworks || []).join(' · ')}`);
  lines.push('');
  lines.push('COVERAGE SUMMARY');
  for (const [k, v] of Object.entries(bundle.coverage_summary || {})) {
    lines.push(`  - ${k}: ${v}`);
  }
  lines.push('');
  const c = bundle.contents || {};
  push(lines, 'MODEL REGISTRY',           c.model_registry);
  push(lines, 'MODEL CARDS',              c.model_cards);
  push(lines, 'SYSTEM SECURITY PLANS',    c.system_security_plans);
  push(lines, 'DPIA RECORDS',             c.dpia_records);
  push(lines, 'LATEST BIAS AUDIT',        c.latest_bias_audit);
  push(lines, 'LATEST DRIFT ANALYSIS',    c.latest_drift_analysis);
  push(lines, 'RECENT EVALUATIONS',       c.recent_evaluations);
  push(lines, 'OPEN INCIDENTS',           c.open_incidents);
  push(lines, 'RED-TEAM FINDINGS',        c.redteam_findings);
  return lines.join('\n');
}

function push(lines, heading, value) {
  lines.push(heading);
  if (value == null) { lines.push('  (none)'); lines.push(''); return; }
  lines.push(JSON.stringify(value, null, 2));
  lines.push('');
}

module.exports = router;

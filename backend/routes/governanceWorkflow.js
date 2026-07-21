const express = require('express');
const pool = require('../config/database');
const { requireRole } = require('../middleware/auth');
const { validateCase, evaluateGates, evidenceFingerprint } = require('../domain/governanceWorkflow');

const router = express.Router();
const tenantOf = (req) => req.user.tenant_key || 'default';

router.post('/cases', async (req, res) => {
  const errors = validateCase(req.body);
  if (errors.length) return res.status(400).json({ error: 'validation_failed', details: errors });
  const gate = evaluateGates(req.body);
  const tenant = tenantOf(req);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const prior = await client.query('SELECT * FROM governance_cases WHERE tenant_key=$1 AND client_case_id=$2', [tenant, req.body.client_case_id]);
    if (prior.rows.length) { await client.query('ROLLBACK'); return res.json({ case: prior.rows[0], idempotent_replay: true }); }
    const item = (await client.query(
      `INSERT INTO governance_cases(tenant_key,client_case_id,model_name,model_version,use_case,owner,requester_id,ruleset_version,risk_tier,status,gate_result)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [tenant, req.body.client_case_id, req.body.model_name, req.body.model_version, req.body.use_case, req.body.owner, req.user.id, gate.ruleset_version, gate.risk_tier, gate.status, gate]
    )).rows[0];
    for (const evidence of req.body.evidence) await client.query(
      `INSERT INTO governance_evidence_snapshots(case_id,evidence_type,source_uri,source_sha256,collected_at,fingerprint)
       VALUES($1,$2,$3,$4,$5,$6)`,
      [item.id, evidence.type, evidence.uri, evidence.sha256, evidence.collected_at, evidenceFingerprint(evidence)]
    );
    for (const evaluation of req.body.evaluations) await client.query(
      `INSERT INTO governance_evaluation_snapshots(case_id,name,metric,dataset_version,code_sha256,score,threshold,passed,random_seed)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [item.id, evaluation.name, evaluation.metric, evaluation.dataset_version, evaluation.code_sha256, evaluation.score, evaluation.threshold, Number(evaluation.score) >= Number(evaluation.threshold), evaluation.random_seed || null]
    );
    await client.query('INSERT INTO governance_immutable_audit(tenant_key,case_id,actor_id,action,details) VALUES($1,$2,$3,$4,$5)', [tenant, item.id, req.user.id, 'case_created', gate]);
    await client.query('COMMIT');
    res.status(201).json({ case: item, gate, warning: 'No model registry, CI/CD, gateway, or deployment action was executed.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('governance case failed:', error);
    res.status(500).json({ error: 'governance_workflow_failed' });
  } finally { client.release(); }
});

router.post('/cases/:id/decision', requireRole('officer', 'admin'), async (req, res) => {
  const decision = req.body?.decision;
  if (!['approve', 'reject'].includes(decision)) return res.status(400).json({ error: 'decision must be approve or reject' });
  const tenant = tenantOf(req);
  const status = decision === 'approve' ? 'approved' : 'rejected';
  const result = await pool.query(
    `UPDATE governance_cases SET status=$1,approved_by=$2,approved_at=NOW(),updated_at=NOW()
     WHERE id=$3 AND tenant_key=$4 AND status='pending_review' AND requester_id<>$2 RETURNING *`,
    [status, req.user.id, req.params.id, tenant]
  );
  if (!result.rows.length) return res.status(409).json({ error: 'case_not_decidable_or_role_separation_failed' });
  await pool.query('INSERT INTO governance_immutable_audit(tenant_key,case_id,actor_id,action,details) VALUES($1,$2,$3,$4,$5)', [tenant, req.params.id, req.user.id, `case_${status}`, { notes: req.body.notes || null }]);
  res.json({ case: result.rows[0], warning: 'Approval records authorization evidence only; deployment remains external and unexecuted.' });
});

router.post('/cases/:id/changes', async (req, res) => {
  if (!req.body?.proposed_version || !req.body?.change_summary) return res.status(400).json({ error: 'proposed_version and change_summary are required' });
  const tenant = tenantOf(req);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query("SELECT * FROM governance_cases WHERE id=$1 AND tenant_key=$2 AND status='approved' FOR UPDATE", [req.params.id, tenant]);
    if (!current.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'approved_case_not_found' }); }
    await client.query('INSERT INTO governance_case_changes(case_id,previous_version,proposed_version,change_summary,requested_by) VALUES($1,$2,$3,$4,$5)', [req.params.id, current.rows[0].model_version, req.body.proposed_version, req.body.change_summary, req.user.id]);
    const updated = (await client.query("UPDATE governance_cases SET status='change_review',approved_by=NULL,approved_at=NULL,updated_at=NOW() WHERE id=$1 RETURNING *", [req.params.id])).rows[0];
    await client.query('INSERT INTO governance_immutable_audit(tenant_key,case_id,actor_id,action,details) VALUES($1,$2,$3,$4,$5)', [tenant, req.params.id, req.user.id, 'change_requested', req.body]);
    await client.query('COMMIT');
    res.status(201).json({ case: updated, warning: 'Prior authorization is suspended; no rollout or registry update was performed.' });
  } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ error: 'change_request_failed' }); }
  finally { client.release(); }
});

router.post('/cases/:id/retire', requireRole('officer', 'admin'), async (req, res) => {
  const tenant = tenantOf(req);
  const result = await pool.query("UPDATE governance_cases SET status='retired',retired_at=NOW(),updated_at=NOW() WHERE id=$1 AND tenant_key=$2 AND status IN ('approved','rejected','blocked') RETURNING *", [req.params.id, tenant]);
  if (!result.rows.length) return res.status(404).json({ error: 'retirable_case_not_found' });
  await pool.query('INSERT INTO governance_immutable_audit(tenant_key,case_id,actor_id,action,details) VALUES($1,$2,$3,$4,$5)', [tenant, req.params.id, req.user.id, 'retirement_recorded', { reason: req.body?.reason || null }]);
  res.json({ case: result.rows[0], warning: 'Retirement is recorded locally; external endpoints and registries were not changed.' });
});

module.exports = router;

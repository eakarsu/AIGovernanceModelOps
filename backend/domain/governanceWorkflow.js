const crypto = require('crypto');
const RULESET_VERSION = 'model-governance-gates-2026-07-18';
const EVIDENCE_TYPES = new Set(['model_card', 'lineage', 'data_sheet', 'evaluation_report', 'security_review', 'impact_assessment']);

function validateCase(input = {}) {
  const errors = [];
  for (const field of ['client_case_id', 'model_name', 'model_version', 'use_case', 'owner']) {
    if (!input[field] || typeof input[field] !== 'string') errors.push(`${field} is required`);
  }
  if (!Array.isArray(input.evidence) || !input.evidence.length) errors.push('at least one evidence item is required');
  for (const evidence of input.evidence || []) {
    if (!EVIDENCE_TYPES.has(evidence.type) || !evidence.uri || !/^[a-f0-9]{64}$/i.test(evidence.sha256 || '') || !evidence.collected_at) {
      errors.push('each evidence item requires a supported type, uri, sha256, and collected_at');
    }
  }
  if (!Array.isArray(input.evaluations) || !input.evaluations.length) errors.push('at least one reproducible evaluation is required');
  for (const evaluation of input.evaluations || []) {
    if (!evaluation.name || !evaluation.metric || !evaluation.dataset_version || !evaluation.code_sha256 || !/^[a-f0-9]{64}$/i.test(evaluation.code_sha256) || !Number.isFinite(Number(evaluation.score)) || !Number.isFinite(Number(evaluation.threshold))) {
      errors.push('each evaluation requires name, metric, dataset_version, code_sha256, score, and threshold');
    }
  }
  return [...new Set(errors)];
}

function riskTier(input) {
  const text = `${input.use_case} ${(input.risk_signals || []).join(' ')}`.toLowerCase();
  if (/social scoring|covert manipulation|biometric categorization/.test(text)) return 'unacceptable';
  if (/health|employment|credit|education|law enforcement|essential service|biometric/.test(text)) return 'high';
  if (/customer facing|personal data|recommendation/.test(text)) return 'limited';
  return 'minimal';
}

function evaluateGates(input) {
  const tier = riskTier(input);
  const required = new Set(tier === 'high' ? ['model_card', 'lineage', 'evaluation_report', 'impact_assessment'] : ['model_card', 'lineage', 'evaluation_report']);
  const present = new Set(input.evidence.map((item) => item.type));
  const missing = [...required].filter((item) => !present.has(item));
  const failedEvaluations = input.evaluations.filter((item) => Number(item.score) < Number(item.threshold)).map((item) => item.name);
  const blockedReasons = [];
  if (tier === 'unacceptable') blockedReasons.push('unacceptable_use_case');
  if (missing.length) blockedReasons.push('missing_required_evidence');
  if (failedEvaluations.length) blockedReasons.push('evaluation_gate_failed');
  return {
    ruleset_version: RULESET_VERSION,
    risk_tier: tier,
    status: blockedReasons.length ? 'blocked' : 'pending_review',
    missing_evidence: missing,
    failed_evaluations: failedEvaluations,
    blocked_reasons: blockedReasons,
    deployment_authorized: false,
  };
}

function evidenceFingerprint(item) {
  return crypto.createHash('sha256').update(JSON.stringify({ type: item.type, uri: item.uri, sha256: item.sha256, collected_at: item.collected_at })).digest('hex');
}

module.exports = { RULESET_VERSION, EVIDENCE_TYPES, validateCase, riskTier, evaluateGates, evidenceFingerprint };

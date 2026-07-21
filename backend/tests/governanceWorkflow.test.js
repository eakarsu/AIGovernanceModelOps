const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCase, evaluateGates, evidenceFingerprint } = require('../domain/governanceWorkflow');

const sha = 'a'.repeat(64);
const input = {
  client_case_id: 'case-1', model_name: 'classifier', model_version: '1.2.0', use_case: 'internal recommendation', owner: 'owner@example.invalid',
  evidence: [
    { type: 'model_card', uri: 'registry://card/1', sha256: sha, collected_at: '2026-07-18T12:00:00Z' },
    { type: 'lineage', uri: 'catalog://lineage/1', sha256: sha, collected_at: '2026-07-18T12:00:00Z' },
    { type: 'evaluation_report', uri: 'eval://run/1', sha256: sha, collected_at: '2026-07-18T12:00:00Z' },
  ],
  evaluations: [{ name: 'quality', metric: 'accuracy', dataset_version: 'fixture-v1', code_sha256: sha, score: 0.91, threshold: 0.9, random_seed: '42' }],
};

test('reproducible evidence passes to pending review but never deployment', () => {
  assert.deepEqual(validateCase(input), []);
  const gate = evaluateGates(input);
  assert.equal(gate.status, 'pending_review');
  assert.equal(gate.deployment_authorized, false);
  assert.equal(evidenceFingerprint(input.evidence[0]).length, 64);
});

test('high-risk missing impact evidence and failed eval are blocked', () => {
  const gate = evaluateGates({ ...input, use_case: 'health treatment eligibility', evaluations: [{ ...input.evaluations[0], score: 0.2 }] });
  assert.equal(gate.risk_tier, 'high');
  assert.equal(gate.status, 'blocked');
  assert.ok(gate.missing_evidence.includes('impact_assessment'));
  assert.deepEqual(gate.failed_evaluations, ['quality']);
});

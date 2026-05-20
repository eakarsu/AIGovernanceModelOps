// Custom Views for MLGov: 4 endpoints (2 VIZ + 2 NON-VIZ)
// VIZ:
//   GET /model-drift-trend            – per-metric / per-model drift over time
//   GET /bias-detection-heatmap       – cohort x metric bias matrix
// NON-VIZ:
//   POST /governance-card-pdf         – generate a governance / model-card PDF
//   GET/POST/PUT/DELETE /policy-rules – ML policy rules (approval gates, retraining thresholds)
const express = require('express');
const router = express.Router();

// --------------------------------------------------------------------------
// In-memory policy-rule store (seeded with realistic ML-governance defaults)
// --------------------------------------------------------------------------
let _ruleSeq = 6;
const policyRules = [
  {
    id: 1,
    rule_id: 'GATE-APPROVE-PROD',
    name: 'Production Deployment Approval Gate',
    rule_type: 'approval_gate',
    trigger: 'deployment.requested',
    threshold: null,
    metric: null,
    required_approvers: ['ai_risk_officer', 'mlops_lead'],
    severity: 'high',
    action: 'block_until_approved',
    enabled: true,
    notes: 'Two-person review for any prod push. EU AI Act Art. 14.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    rule_id: 'RETRAIN-DRIFT-PSI',
    name: 'Retrain on PSI drift',
    rule_type: 'retraining_threshold',
    trigger: 'drift.psi',
    threshold: 0.25,
    metric: 'PSI',
    required_approvers: ['mlops_lead'],
    severity: 'medium',
    action: 'schedule_retrain',
    enabled: true,
    notes: 'PSI > 0.25 across any feature group triggers retrain pipeline.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    rule_id: 'BIAS-DISPARATE-IMPACT',
    name: 'Disparate-impact bias check',
    rule_type: 'bias_threshold',
    trigger: 'evaluation.completed',
    threshold: 0.8,
    metric: 'disparate_impact_ratio',
    required_approvers: ['fairness_review_board'],
    severity: 'high',
    action: 'block_promotion',
    enabled: true,
    notes: '4/5ths rule — DI < 0.80 blocks promotion to higher-risk tier.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    rule_id: 'CARD-REQ-HIGH-RISK',
    name: 'Model Card Required (high-risk)',
    rule_type: 'approval_gate',
    trigger: 'model.promote_high_risk',
    threshold: null,
    metric: null,
    required_approvers: ['compliance', 'admin'],
    severity: 'critical',
    action: 'block_until_card_signed',
    enabled: true,
    notes: 'EU AI Act Annex IV documentation must be complete + signed.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    rule_id: 'RETRAIN-ACC-DROP',
    name: 'Retrain on accuracy degradation',
    rule_type: 'retraining_threshold',
    trigger: 'eval.accuracy',
    threshold: 0.05,
    metric: 'accuracy_delta',
    required_approvers: ['mlops_lead'],
    severity: 'medium',
    action: 'schedule_retrain',
    enabled: true,
    notes: 'Relative accuracy drop > 5% vs baseline triggers retraining.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    rule_id: 'INCIDENT-AUTO-ROLLBACK',
    name: 'Auto-rollback on severity-1 incident',
    rule_type: 'approval_gate',
    trigger: 'incident.severity_1',
    threshold: null,
    metric: null,
    required_approvers: [],
    severity: 'critical',
    action: 'auto_rollback_last_known_good',
    enabled: true,
    notes: 'Skip approvals — immediate rollback, notify on-call.',
    updated_at: new Date().toISOString(),
  },
];

// --------------------------------------------------------------------------
// Deterministic-pseudo-random series so the chart looks stable across reloads
// --------------------------------------------------------------------------
function seededRand(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0x7fffffff) / 0x7fffffff;
  };
}
function strSeed(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// --------------------------------------------------------------------------
// 1) VIZ: model drift trend (per metric / per model)
// --------------------------------------------------------------------------
router.get('/model-drift-trend', (req, res) => {
  try {
    const model = String(req.query.model || 'internal-fraud-classifier');
    const metric = String(req.query.metric || 'PSI');
    const days = Math.max(7, Math.min(90, Number(req.query.days) || 30));

    const rand = seededRand(strSeed(`${model}|${metric}`));
    const baseline = metric === 'PSI' ? 0.05 : metric === 'KS' ? 0.10 : 0.90;
    const isLowerBetter = metric === 'PSI' || metric === 'KS' || metric === 'JS_divergence';

    const today = new Date();
    const points = [];
    let cur = baseline;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // Drift slowly creeps up (or accuracy creeps down)
      const noise = (rand() - 0.5) * (isLowerBetter ? 0.02 : 0.015);
      const trend = isLowerBetter ? ((days - i) * 0.008) : -((days - i) * 0.003);
      cur = Math.max(0, baseline + trend + noise);
      points.push({
        date: d.toISOString().slice(0, 10),
        value: Number(cur.toFixed(4)),
      });
    }

    const threshold = isLowerBetter
      ? (metric === 'PSI' ? 0.25 : metric === 'KS' ? 0.20 : 0.30)
      : 0.85;
    const breached = isLowerBetter
      ? points.filter((p) => p.value >= threshold).length
      : points.filter((p) => p.value <= threshold).length;

    res.json({
      model,
      metric,
      days,
      threshold,
      direction: isLowerBetter ? 'lower_is_better' : 'higher_is_better',
      breached_points: breached,
      latest: points[points.length - 1],
      baseline,
      points,
      available_models: [
        'internal-fraud-classifier',
        'customer-support-rag',
        'credit-decisioning-v3',
        'churn-propensity-xgb',
        'multilingual-router',
      ],
      available_metrics: ['PSI', 'KS', 'JS_divergence', 'accuracy', 'auc'],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --------------------------------------------------------------------------
// 2) VIZ: bias detection heatmap (cohort x metric)
// --------------------------------------------------------------------------
router.get('/bias-detection-heatmap', (req, res) => {
  try {
    const model = String(req.query.model || 'credit-decisioning-v3');
    const cohorts = [
      'age_18_25', 'age_26_40', 'age_41_60', 'age_60_plus',
      'gender_F', 'gender_M', 'gender_NB',
      'region_EU', 'region_US', 'region_APAC',
    ];
    const metrics = [
      'disparate_impact',
      'equal_opportunity_diff',
      'statistical_parity_diff',
      'false_positive_rate',
      'false_negative_rate',
    ];

    const rand = seededRand(strSeed(model));
    // Per (cohort, metric) — produce a value and a severity classification.
    const cells = [];
    for (const c of cohorts) {
      for (const m of metrics) {
        let v;
        if (m === 'disparate_impact') {
          v = 0.6 + rand() * 0.7; // 0.6 – 1.3
        } else if (m === 'false_positive_rate' || m === 'false_negative_rate') {
          v = rand() * 0.4; // 0 – 0.4
        } else {
          v = (rand() - 0.5) * 0.4; // -0.2 – +0.2
        }
        v = Number(v.toFixed(3));
        let severity = 'ok';
        if (m === 'disparate_impact') {
          if (v < 0.8 || v > 1.25) severity = 'high';
          else if (v < 0.9 || v > 1.1) severity = 'medium';
        } else if (m === 'false_positive_rate' || m === 'false_negative_rate') {
          if (v > 0.25) severity = 'high';
          else if (v > 0.15) severity = 'medium';
        } else {
          const a = Math.abs(v);
          if (a > 0.12) severity = 'high';
          else if (a > 0.06) severity = 'medium';
        }
        cells.push({ cohort: c, metric: m, value: v, severity });
      }
    }

    const summary = {
      total_cells: cells.length,
      high: cells.filter((x) => x.severity === 'high').length,
      medium: cells.filter((x) => x.severity === 'medium').length,
      ok: cells.filter((x) => x.severity === 'ok').length,
    };

    res.json({ model, cohorts, metrics, cells, summary });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --------------------------------------------------------------------------
// 3) NON-VIZ: governance / model-card PDF (minimal hand-rolled PDF)
//    No external pdf lib required — produces a valid single-page PDF.
// --------------------------------------------------------------------------
router.post('/governance-card-pdf', (req, res) => {
  try {
    const body = req.body || {};
    const model = String(body.model || 'internal-fraud-classifier');
    const owner = String(body.owner || 'AI Risk Office');
    const riskTier = String(body.risk_tier || 'high-risk');
    const framework = String(body.framework || 'EU AI Act · NIST AI RMF · ISO 42001');
    const intendedUse = String(body.intended_use || 'Detect fraudulent transactions in real time across EU markets.');
    const limitations = String(body.limitations || 'Not validated for synthetic identity attack vectors; degraded on out-of-distribution merchants.');
    const evaluations = String(body.evaluations || 'AUC=0.943 (baseline), PSI=0.07 (last 30d), Disparate impact=0.91 across protected cohorts.');
    const dataSources = String(body.data_sources || 'Internal transaction ledger (2019–2025), labelled fraud cases curated by Risk Ops.');
    const date = new Date().toISOString().slice(0, 10);

    const lines = [
      'AI GOVERNANCE / MODEL CARD',
      '',
      `Model:        ${model}`,
      `Owner:        ${owner}`,
      `Risk tier:    ${riskTier}`,
      `Frameworks:   ${framework}`,
      `Generated:    ${date}`,
      '',
      'INTENDED USE',
      ...wrap(intendedUse, 86),
      '',
      'LIMITATIONS',
      ...wrap(limitations, 86),
      '',
      'EVALUATIONS',
      ...wrap(evaluations, 86),
      '',
      'DATA SOURCES',
      ...wrap(dataSources, 86),
      '',
      'GOVERNANCE',
      '  - Two-person approval required for production deployment.',
      '  - Continuous drift + bias monitoring (PSI / disparate impact).',
      '  - Auto-rollback on severity-1 incident.',
      '  - Quarterly review by AI Risk Office and Compliance.',
      '',
      `Signed (auto): AI Governance ModelOps · ${date}`,
    ];

    const pdf = buildPdf(lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="model-card-${model}-${date}.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    res.end(pdf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --------------------------------------------------------------------------
// 4) NON-VIZ: ML policy rules CRUD
// --------------------------------------------------------------------------
router.get('/policy-rules', (req, res) => {
  res.json({
    rules: policyRules,
    total: policyRules.length,
    enabled: policyRules.filter((r) => r.enabled).length,
    by_type: policyRules.reduce((acc, r) => {
      acc[r.rule_type] = (acc[r.rule_type] || 0) + 1;
      return acc;
    }, {}),
    rule_types: ['approval_gate', 'retraining_threshold', 'bias_threshold'],
    actions: [
      'block_until_approved', 'schedule_retrain', 'block_promotion',
      'block_until_card_signed', 'auto_rollback_last_known_good', 'notify_only',
    ],
    severities: ['low', 'medium', 'high', 'critical'],
  });
});

router.post('/policy-rules', (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'name is required' });
  const r = {
    id: ++_ruleSeq,
    rule_id: b.rule_id || `RULE-${Date.now()}`,
    name: String(b.name),
    rule_type: b.rule_type || 'approval_gate',
    trigger: b.trigger || 'deployment.requested',
    threshold: b.threshold ?? null,
    metric: b.metric || null,
    required_approvers: Array.isArray(b.required_approvers) ? b.required_approvers : [],
    severity: b.severity || 'medium',
    action: b.action || 'notify_only',
    enabled: b.enabled !== false,
    notes: b.notes || '',
    updated_at: new Date().toISOString(),
  };
  policyRules.push(r);
  res.status(201).json(r);
});

router.put('/policy-rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const i = policyRules.findIndex((r) => r.id === id);
  if (i === -1) return res.status(404).json({ error: 'Rule not found' });
  const b = req.body || {};
  policyRules[i] = {
    ...policyRules[i],
    ...b,
    id,
    required_approvers: Array.isArray(b.required_approvers)
      ? b.required_approvers
      : policyRules[i].required_approvers,
    updated_at: new Date().toISOString(),
  };
  res.json(policyRules[i]);
});

router.delete('/policy-rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const i = policyRules.findIndex((r) => r.id === id);
  if (i === -1) return res.status(404).json({ error: 'Rule not found' });
  const [removed] = policyRules.splice(i, 1);
  res.json({ message: 'Deleted', row: removed });
});

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
function wrap(text, width) {
  const words = String(text).split(/\s+/);
  const out = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) { if (line) out.push(line); line = w; }
    else line = line ? line + ' ' + w : w;
  }
  if (line) out.push(line);
  return out;
}

function pdfEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdf(lines) {
  // Minimal single-page PDF using Helvetica @ 11pt, top-down text.
  const fontSize = 11;
  const leading = 14;
  const startX = 50;
  const startY = 780;

  const textOps = [];
  textOps.push('BT');
  textOps.push(`/F1 ${fontSize} Tf`);
  textOps.push(`${leading} TL`);
  textOps.push(`${startX} ${startY} Td`);
  lines.forEach((ln, idx) => {
    if (idx === 0) textOps.push(`(${pdfEscape(ln)}) Tj`);
    else textOps.push(`T* (${pdfEscape(ln)}) Tj`);
  });
  textOps.push('ET');
  const stream = textOps.join('\n');

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n');
  objects.push(`4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream\nendobj\n`);
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += objects[i];
  }
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

module.exports = router;

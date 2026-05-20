const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');
const { fireWebhooks } = require('../services/webhooks');
const { addNotification } = require('../services/notifications');

async function persist(feature, input, output) {
  try {
    await pool.query(
      `INSERT INTO ai_results (feature, input, output, model) VALUES ($1, $2, $3, $4)`,
      [feature, JSON.stringify(input || {}), JSON.stringify(output || {}), process.env.OPENROUTER_MODEL || 'unknown']
    );
  } catch (err) {
    console.error(`[ai-persist:${feature}]`, err.message);
  }
}

function handler(feature, fn) {
  return async (req, res) => {
    try {
      const out = await fn(req.body || {});
      persist(feature, req.body || {}, out).catch((e) => console.error(`[ai-persist:${feature}]`, e.message));

      // Cross-cutting: fire alert notifications for high-severity AI outputs
      const sev = out?.confirmed_severity || out?.rating || out?.risk_rating || out?.overall_assessment;
      if (sev && /high|critical|fail|fragile/i.test(String(sev))) {
        addNotification({
          user_email: null,
          kind: 'ai_alert',
          title: `AI ${feature} flagged ${sev}`,
          body: out?.summary || `An AI ${feature} run produced a ${sev} signal.`,
          resource: 'ai_results',
        }).catch(() => {});
        fireWebhooks('ai.alert', { feature, severity: sev, summary: out?.summary || null }).catch(() => {});
      }

      res.json(out);
    } catch (e) {
      console.error(`[ai-handler:${feature}]`, e.message);
      res.status(500).json({ error: e.message });
    }
  };
}

// Original 6
router.post('/audit-bias',      handler('audit_bias',      ai.auditBias));
router.post('/detect-drift',    handler('detect_drift',    ai.detectDrift));
router.post('/map-compliance',  handler('map_compliance',  ai.mapCompliance));
router.post('/score-risk',      handler('score_risk',      ai.scoreRisk));
router.post('/draft-policy',    handler('draft_policy',    ai.draftPolicy));
router.post('/triage-incident', handler('triage_incident', ai.triageIncident));

// New 10
router.post('/explain-decision',      handler('explain_decision',      ai.explainDecision));
router.post('/prompt-injection-test', handler('prompt_injection_test', ai.promptInjectionTest));
router.post('/fairness-curve',        handler('fairness_curve',        ai.fairnessCurve));
router.post('/data-lineage',          handler('data_lineage',          ai.dataLineage));
router.post('/model-card-generator',  handler('model_card_generator',  ai.modelCardGenerator));
router.post('/third-party-assess',    handler('third_party_assess',    ai.thirdPartyAssess));
router.post('/jailbreak-test',        handler('jailbreak_test',        ai.jailbreakTest));
router.post('/energy-cost',           handler('energy_cost',           ai.energyCost));
router.post('/control-mapper',        handler('control_mapper',        ai.controlMapper));
router.post('/ssp-drafter',           handler('ssp_drafter',           ai.sspDrafter));

// -----------------------------------------------------------------------------
// Sample-fill scenarios — 5 realistic governance scenarios per AI verb.
// Frontend fetches GET /api/ai/samples?feature=<verb> and renders 5 buttons
// above the form that, when clicked, pre-fill the form with `values`.
// Keys in `values` MUST match the `key` of each field on the corresponding
// AI page (see frontend/src/pages/AI*Page.js).
// -----------------------------------------------------------------------------
const AI_SAMPLES = {
  'audit-bias': [
    { label: 'Resume screener (gender DP gap)',
      values: { model: 'gpt-4o', dataset: 'kaggle-resume-2024', metric: 'demographic_parity', score: '0.187',
        notes: 'CV ranking model favoring male-coded names by 18.7pp; subgroup analysis across gender and ethnicity on 12k EU applicants.' } },
    { label: 'Speech-to-text WER gap (dialect)',
      values: { model: 'whisper-large-v3', dataset: 'common-voice-en-accents', metric: 'WER_gap', score: '0.094',
        notes: 'WER gap between Standard American English and African-American Vernacular English exceeds 9pp on 8h test set.' } },
    { label: 'Credit scoring equal-opportunity',
      values: { model: 'claude-3-5-sonnet', dataset: 'home-mortgage-disclosure-act-2023', metric: 'equal_opportunity', score: '0.071',
        notes: 'TPR gap across race subgroups in mortgage approval; tested under EU AI Act Annex III §5 high-risk credit-scoring scope.' } },
    { label: 'Facial recognition calibration drift',
      values: { model: 'llama-3-70b-vision', dataset: 'fairface', metric: 'calibration', score: '0.122',
        notes: 'Calibration miscalibration across skin-tone bands; ECE delta 12.2pp between lightest and darkest groups.' } },
    { label: 'Recidivism risk equalized odds',
      values: { model: 'gpt-4o-mini', dataset: 'compas-recid-2024', metric: 'equalized_odds', score: '0.214',
        notes: 'FPR+FNR sum disparity across race in pre-trial risk scoring; flagged for NIST RMF MEASURE-2.11 review.' } },
  ],
  'detect-drift': [
    { label: 'Fraud classifier — PSI alert',
      values: { model: 'internal-fraud-classifier-v7', baselineMetric: 0.156, currentMetric: 0.412, window: 'last 14 days', signal: 'PSI' } },
    { label: 'Demand forecast — metric delta',
      values: { model: 'retail-demand-forecast-xgb', baselineMetric: 0.943, currentMetric: 0.812, window: 'last 30 days', signal: 'metric_delta' } },
    { label: 'LLM safety classifier — KS shift',
      values: { model: 'llama-guard-3-8b', baselineMetric: 0.087, currentMetric: 0.241, window: 'last 7 days', signal: 'KS' } },
    { label: 'Recommender — Wasserstein',
      values: { model: 'gpt-4o-embeddings-recsys', baselineMetric: 0.21, currentMetric: 0.58, window: 'last 60 days', signal: 'wasserstein' } },
    { label: 'Claims NLP — JS divergence',
      values: { model: 'claude-3-5-sonnet-claims-triage', baselineMetric: 0.04, currentMetric: 0.19, window: 'last 21 days', signal: 'JS_divergence' } },
  ],
  'map-compliance': [
    { label: 'CV resume screener (EU AI Act high)',
      values: { system: 'CV resume screener for EU operations', riskTier: 'high', framework: 'EU_AI_Act',
        description: 'GPT-4o-based CV ranking for 12-country EU hiring pipeline; Annex III §4 employment use-case; affects ~80k applicants/yr.' } },
    { label: 'Customer-support RAG (NIST RMF)',
      values: { system: 'customer-support-rag (claude-3.5-sonnet)', riskTier: 'limited', framework: 'NIST_RMF',
        description: 'RAG over public KB + ticket history; human-on-the-loop; logged transcripts; scoped to NIST RMF GOVERN/MAP/MEASURE/MANAGE.' } },
    { label: 'Medical imaging triage (EU AI Act)',
      values: { system: 'radiology-triage-cnn for chest X-rays', riskTier: 'high', framework: 'EU_AI_Act',
        description: 'CNN classifier flagging suspected pneumothorax; CE-marked medical device; Annex III §5 + MDR overlap.' } },
    { label: 'Internal HR chatbot (ISO 42001)',
      values: { system: 'internal HR policy chatbot (llama-3-70b)', riskTier: 'minimal', framework: 'ISO_42001',
        description: 'Employee-facing FAQ assistant; no automated decisions; ISO 42001 Annex A scoping for AIMS coverage.' } },
    { label: 'Social-scoring (unacceptable)',
      values: { system: 'citizen-trust score for municipal services', riskTier: 'unacceptable', framework: 'EU_AI_Act',
        description: 'General-purpose social scoring by public authority; EU AI Act Art.5(1)(c) prohibited practice — recommend halt.' } },
  ],
  'score-risk': [
    { label: 'Loan approval ML model',
      values: { useCase: 'Automated consumer-credit underwriting in EU using gpt-4o-tuned scorer', dataSensitivity: 'pii',
        autonomy: 'human-on-the-loop', exposedPopulation: 'customers', modality: 'tabular' } },
    { label: 'Resume screening (Annex III §4)',
      values: { useCase: 'CV ranking and shortlist for EU-wide engineering hiring via claude-3.5-sonnet', dataSensitivity: 'pii',
        autonomy: 'human-in-the-loop', exposedPopulation: 'general_public', modality: 'text' } },
    { label: 'Deepfake detection',
      values: { useCase: 'Real-time deepfake detection on user-uploaded video for trust-and-safety using llama-3-70b-vision', dataSensitivity: 'confidential',
        autonomy: 'fully-autonomous', exposedPopulation: 'general_public', modality: 'vision' } },
    { label: 'Recidivism prediction',
      values: { useCase: 'Pre-trial recidivism risk scoring for judicial decision support (gpt-4o)', dataSensitivity: 'special_category',
        autonomy: 'human-on-the-loop', exposedPopulation: 'minors_or_vulnerable', modality: 'tabular' } },
    { label: 'Healthcare diagnosis assist',
      values: { useCase: 'Chest X-ray pneumothorax flagging in EU hospitals (med-pali-2 fine-tune)', dataSensitivity: 'special_category',
        autonomy: 'human-in-the-loop', exposedPopulation: 'customers', modality: 'vision' } },
  ],
  'draft-policy': [
    { label: 'Human oversight (EU AI Act high-risk)',
      values: { topic: 'Human oversight for high-risk AI systems under EU AI Act Article 14', framework: 'EU_AI_Act',
        scope: 'All production AI systems classified high-risk under EU AI Act Annex III, deployed across EU operations.',
        owner: 'Head of AI Governance' } },
    { label: 'GenAI acceptable-use (NIST RMF)',
      values: { topic: 'Acceptable-use policy for generative-AI tools (gpt-4o, claude-3.5-sonnet) by employees', framework: 'NIST_RMF',
        scope: 'All ~12k employees with access to approved enterprise GenAI assistants; covers data classes, prompt logging, IP.',
        owner: 'Chief Information Security Officer' } },
    { label: 'Model release governance (ISO 42001)',
      values: { topic: 'Production model release approval gates aligned to ISO 42001 Annex A.6', framework: 'ISO_42001',
        scope: 'All internally trained or fine-tuned models prior to production deployment, including llama-3-70b derivatives.',
        owner: 'Director of MLOps' } },
    { label: 'Third-party AI vendor onboarding',
      values: { topic: 'Vendor risk and due-diligence for third-party AI processors', framework: 'NIST_RMF',
        scope: 'Any external vendor providing model APIs, training compute, or labeled data — e.g. OpenAI, Anthropic, Scale AI.',
        owner: 'Head of Procurement & Vendor Risk' } },
    { label: 'Incident response & EU AI Act notification',
      values: { topic: 'AI incident response, root-cause, and Article 73 serious-incident notification', framework: 'EU_AI_Act',
        scope: 'All high-risk AI systems in EU production; covers triage, regulator notification within 15 days, and remediation.',
        owner: 'AI Incident Response Lead' } },
  ],
  'triage-incident': [
    { label: 'Hallucinated regulatory citation',
      values: { model: 'gpt-4o', type: 'hallucination', severity: 'medium',
        description: 'Customer-facing support assistant fabricated a non-existent GDPR clause when answering an EU tenant query; ~40 affected sessions.' } },
    { label: 'PII leak via RAG retriever',
      values: { model: 'claude-3-5-sonnet', type: 'privacy', severity: 'high',
        description: 'RAG retriever surfaced internal HR records containing employee PII to unauthorized users; estimated 220 records exposed over 2h window.' } },
    { label: 'Drift triggering loan denials',
      values: { model: 'internal-fraud-classifier-v7', type: 'drift', severity: 'high',
        description: 'Distribution shift in transaction features increased false-positive declines by 3.4x for EU customers in last 72h.' } },
    { label: 'Prompt-injection data exfil',
      values: { model: 'llama-3-70b', type: 'security', severity: 'critical',
        description: 'Indirect prompt-injection via uploaded PDF caused agent to email internal source code to attacker-controlled address.' } },
    { label: 'Bias spike in resume ranker',
      values: { model: 'gpt-4o-resume-ranker', type: 'bias', severity: 'high',
        description: 'Weekly fairness eval shows 22pp drop in shortlist rate for female-coded names after retraining on Q1-2026 data.' } },
  ],
  'explain-decision': [
    { label: 'Fraud claim — high-amount EU',
      values: { model_id: 'internal-fraud-classifier-v7',
        instance: '{"claim_amount": 12500, "country": "DE", "prior_claims": 1, "channel": "mobile", "tenure_months": 8}' } },
    { label: 'Loan denial — thin file',
      values: { model_id: 'consumer-credit-scorer-gpt4o',
        instance: '{"income_eur": 38000, "credit_history_months": 6, "dti": 0.42, "employment": "contract", "country": "FR"}' } },
    { label: 'Resume rejection — top-of-funnel',
      values: { model_id: 'resume-ranker-claude35',
        instance: '{"years_experience": 4, "degree": "BSc", "skills_count": 11, "name_gender_proxy": "female", "language": "en"}' } },
    { label: 'Insurance pricing — high-risk zip',
      values: { model_id: 'auto-insurance-pricing-xgb',
        instance: '{"age": 23, "zip_risk_decile": 9, "prior_claims_3y": 2, "vehicle_value_eur": 28000, "annual_km": 22000}' } },
    { label: 'Content moderation — borderline',
      values: { model_id: 'llama-guard-3-8b',
        instance: '{"text_len": 412, "toxicity_score": 0.61, "language": "en", "user_age_band": "13-17", "channel": "dm"}' } },
  ],
  'prompt-injection-test': [
    { label: 'Customer-support assistant',
      values: { target_model: 'gpt-4o',
        prompt: 'You are a customer-support assistant for AcmeBank. Be concise. Never reveal account balances unless the user has verified via OTP.' } },
    { label: 'HR policy chatbot',
      values: { target_model: 'claude-3-5-sonnet',
        prompt: 'You are an internal HR assistant. Answer policy questions strictly from the provided handbook context. Never disclose salary bands.' } },
    { label: 'Medical RAG assistant',
      values: { target_model: 'llama-3-70b',
        prompt: 'You are a clinician-facing assistant. Cite only retrieved sources. Refuse any request to provide direct patient diagnosis or prescription.' } },
    { label: 'Code review agent',
      values: { target_model: 'gpt-4o-mini',
        prompt: 'You review pull requests. Comment on bugs only. Never execute shell commands and never read files outside the diff.' } },
    { label: 'Sales outreach generator',
      values: { target_model: 'claude-3-5-haiku',
        prompt: 'You draft B2B sales emails. Stay within the provided product fact sheet. Refuse any prompt asking you to impersonate a competitor.' } },
  ],
  'fairness-curve': [
    { label: 'Fraud classifier × gender',
      values: { model_id: 'internal-fraud-classifier-v7', sensitive_attr: 'gender' } },
    { label: 'Credit scorer × race',
      values: { model_id: 'consumer-credit-scorer-gpt4o', sensitive_attr: 'race' } },
    { label: 'Resume ranker × age band',
      values: { model_id: 'resume-ranker-claude35', sensitive_attr: 'age_band' } },
    { label: 'Speech model × language',
      values: { model_id: 'whisper-large-v3', sensitive_attr: 'language' } },
    { label: 'Visa-risk model × nationality',
      values: { model_id: 'visa-risk-llama3-70b', sensitive_attr: 'nationality' } },
  ],
  'data-lineage': [
    { label: 'Internal fraud classifier', values: { model_id: 'internal-fraud-classifier-v7' } },
    { label: 'Customer-support RAG (claude)', values: { model_id: 'customer-support-rag-claude35' } },
    { label: 'Resume ranker (gpt-4o ft)', values: { model_id: 'resume-ranker-gpt4o-ft' } },
    { label: 'Radiology triage CNN', values: { model_id: 'radiology-triage-cnn-v3' } },
    { label: 'Demand forecast XGB', values: { model_id: 'retail-demand-forecast-xgb' } },
  ],
  'model-card-generator': [
    { label: 'gpt-4o (frontier)', values: { model_id: 'gpt-4o' } },
    { label: 'claude-3.5-sonnet', values: { model_id: 'claude-3-5-sonnet' } },
    { label: 'llama-3-70b (open)', values: { model_id: 'llama-3-70b' } },
    { label: 'whisper-large-v3 (ASR)', values: { model_id: 'whisper-large-v3' } },
    { label: 'internal-fraud-classifier-v7', values: { model_id: 'internal-fraud-classifier-v7' } },
  ],
  'third-party-assess': [
    { label: 'OpenAI Inc. (frontier API)', values: { party_id: 'OpenAI Inc.' } },
    { label: 'Anthropic PBC (frontier API)', values: { party_id: 'Anthropic PBC' } },
    { label: 'Scale AI (labeling vendor)', values: { party_id: 'Scale AI' } },
    { label: 'Hugging Face Hub (model registry)', values: { party_id: 'Hugging Face Inc.' } },
    { label: 'TP-001 (internal vendor ID)', values: { party_id: 'TP-001' } },
  ],
  'jailbreak-test': [
    { label: 'claude-3.5-sonnet', values: { model: 'claude-3-5-sonnet' } },
    { label: 'gpt-4o', values: { model: 'gpt-4o' } },
    { label: 'llama-3-70b', values: { model: 'llama-3-70b' } },
    { label: 'gpt-4o-mini', values: { model: 'gpt-4o-mini' } },
    { label: 'mistral-large-2', values: { model: 'mistral-large-2' } },
  ],
  'energy-cost': [
    { label: 'gpt-4o @ 5 QPS', values: { model: 'gpt-4o', est_qps: 5 } },
    { label: 'claude-3.5-sonnet @ 25 QPS', values: { model: 'claude-3-5-sonnet', est_qps: 25 } },
    { label: 'llama-3-70b self-hosted @ 50 QPS', values: { model: 'llama-3-70b', est_qps: 50 } },
    { label: 'gpt-4o-mini batch @ 200 QPS', values: { model: 'gpt-4o-mini', est_qps: 200 } },
    { label: 'whisper-large-v3 streaming @ 10 QPS', values: { model: 'whisper-large-v3', est_qps: 10 } },
  ],
  'control-mapper': [
    { label: 'EU AI Act Art.9 — RAG system',
      values: { control_id: 'EU_AI_Act_Art.9_Risk_Management', system: 'customer-support-rag (claude-3.5-sonnet)' } },
    { label: 'NIST RMF GOVERN-1.1 — fraud model',
      values: { control_id: 'NIST_RMF_GOVERN-1.1', system: 'internal-fraud-classifier-v7' } },
    { label: 'NIST RMF MEASURE-2.11 — resume ranker',
      values: { control_id: 'NIST_RMF_MEASURE-2.11', system: 'resume-ranker-gpt4o-ft' } },
    { label: 'ISO 42001 A.6.2.4 — model release',
      values: { control_id: 'ISO_42001_A.6.2.4', system: 'llama-3-70b internal fine-tunes' } },
    { label: 'CTRL-001 — radiology triage',
      values: { control_id: 'CTRL-001', system: 'radiology-triage-cnn-v3' } },
  ],
  'ssp-drafter': [
    { label: 'Customer-support RAG (NIST RMF)',
      values: { system_name: 'customer-support-rag (claude-3.5-sonnet)', framework: 'NIST_RMF' } },
    { label: 'Resume ranker (ISO 42001)',
      values: { system_name: 'resume-ranker-gpt4o-ft', framework: 'ISO_42001' } },
    { label: 'Fraud classifier (NIST RMF)',
      values: { system_name: 'internal-fraud-classifier-v7', framework: 'NIST_RMF' } },
    { label: 'Radiology triage CNN (ISO 42001)',
      values: { system_name: 'radiology-triage-cnn-v3', framework: 'ISO_42001' } },
    { label: 'HR chatbot llama-3-70b (ISO 42001)',
      values: { system_name: 'hr-policy-chatbot (llama-3-70b)', framework: 'ISO_42001' } },
  ],
};

router.get('/samples', (req, res) => {
  const feature = (req.query.feature || '').toString().trim();
  if (!feature) {
    return res.status(400).json({ error: 'feature query param required' });
  }
  const samples = AI_SAMPLES[feature];
  if (!samples) {
    return res.status(404).json({ error: `no samples for feature '${feature}'`, available: Object.keys(AI_SAMPLES) });
  }
  res.json({ feature, samples });
});

// Recent AI results for audit trail
router.get('/results', async (req, res) => {
  try {
    const r = await pool.query(`SELECT id, feature, model, created_at FROM ai_results ORDER BY id DESC LIMIT 50`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Past AI results for a specific feature (full input + output payloads)
router.get('/history', async (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    if (!feature) return res.status(400).json({ error: 'feature query param required' });
    const r = await pool.query(
      `SELECT id, feature, input, output, model, created_at
       FROM ai_results WHERE feature = $1 ORDER BY id DESC LIMIT $2`,
      [feature, limit]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ai_governance_modelops',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  try {
    const schema = fs.readFileSync(path.join(__dirname, '../migrations/001_schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema created.');

    // ---------- USERS (RBAC: admin / officer / auditor + legacy compliance) ----------
    const demoUsers = [
      { email: 'compliance@aigov.io', password: 'audit123', name: 'Compliance Lead', role: 'compliance' },
      { email: 'admin@aigov.io',      password: 'admin123', name: 'Platform Admin',   role: 'admin' },
      { email: 'officer@aigov.io',    password: 'officer123', name: 'AI Risk Officer', role: 'officer' },
      { email: 'auditor@aigov.io',    password: 'auditor123', name: 'Read-only Auditor', role: 'auditor' },
    ];
    for (const u of demoUsers) {
      const hash = await bcrypt.hash(u.password, 10);
      await client.query(
        `INSERT INTO users (email, password, name, role) VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role`,
        [u.email, hash, u.name, u.role]
      );
    }
    console.log(`Inserted ${demoUsers.length} users.`);

    // ---------- 15 MODELS ----------
    const models = [
      ['MDL-001', 'gpt-4o', 'OpenAI', '2024-08-06', 'alice.chen@corp.io', '2024-09-12', 'high', 'active'],
      ['MDL-002', 'claude-3-haiku', 'Anthropic', '20240307', 'ben.osei@corp.io', '2024-04-21', 'limited', 'active'],
      ['MDL-003', 'llama-3-70b-instruct', 'Meta', '3.0', 'priya.rao@corp.io', '2024-05-18', 'high', 'active'],
      ['MDL-004', 'mistral-large', 'Mistral AI', '24.07', 'felix.koch@corp.io', '2024-08-02', 'limited', 'active'],
      ['MDL-005', 'gemini-1.5-pro', 'Google', '001', 'sara.lopez@corp.io', '2024-06-30', 'high', 'active'],
      ['MDL-006', 'claude-3-5-sonnet', 'Anthropic', '20241022', 'alice.chen@corp.io', '2024-10-25', 'high', 'active'],
      ['MDL-007', 'gpt-4o-mini', 'OpenAI', '2024-07-18', 'ben.osei@corp.io', '2024-07-22', 'minimal', 'active'],
      ['MDL-008', 'llama-3-8b-instruct', 'Meta', '3.0', 'priya.rao@corp.io', '2024-04-30', 'minimal', 'deprecated'],
      ['MDL-009', 'codestral-22b', 'Mistral AI', '22B-v0.1', 'felix.koch@corp.io', '2024-05-29', 'limited', 'active'],
      ['MDL-010', 'phi-3-medium', 'Microsoft', '4k-instruct', 'sara.lopez@corp.io', '2024-05-22', 'limited', 'active'],
      ['MDL-011', 'whisper-large-v3', 'OpenAI', 'v3', 'alice.chen@corp.io', '2024-02-15', 'limited', 'active'],
      ['MDL-012', 'dall-e-3', 'OpenAI', '3.0', 'ben.osei@corp.io', '2024-03-04', 'high', 'restricted'],
      ['MDL-013', 'stable-diffusion-xl', 'Stability AI', '1.0', 'priya.rao@corp.io', '2024-01-20', 'high', 'active'],
      ['MDL-014', 'qwen2-72b-instruct', 'Alibaba', '2.0', 'felix.koch@corp.io', '2024-06-07', 'high', 'pilot'],
      ['MDL-015', 'internal-fraud-classifier', 'In-house', '2.4.1', 'sara.lopez@corp.io', '2024-09-01', 'unacceptable', 'restricted'],
    ];
    for (const r of models) {
      await client.query(
        `INSERT INTO models (model_id, name, provider, version, owner, deployed_at, risk_tier, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        r
      );
    }
    console.log(`Inserted ${models.length} models.`);

    // ---------- 15 DATASETS ----------
    const datasets = [
      ['DS-001', 'ImageNet-1k', 'Stanford Vision Lab', 'public', 1281167, 'Custom Research', '2024-01-15', false],
      ['DS-002', 'CommonCrawl-2024-26', 'Common Crawl Foundation', 'public', 3500000000, 'CC0', '2024-07-04', false],
      ['DS-003', 'MIMIC-IV', 'PhysioNet', 'restricted', 299712, 'PhysioNet DUA', '2024-02-21', true],
      ['DS-004', 'OpenWebText2', 'EleutherAI', 'public', 17103000, 'MIT', '2024-03-11', false],
      ['DS-005', 'LAION-5B', 'LAION', 'public', 5850000000, 'CC-BY 4.0', '2024-04-19', false],
      ['DS-006', 'C4 (Colossal Clean Crawled)', 'Google Research', 'public', 750000000, 'ODC-By 1.0', '2024-04-29', false],
      ['DS-007', 'internal-claims-2024', 'In-house', 'confidential', 482300, 'Proprietary', '2024-08-12', true],
      ['DS-008', 'GLUE benchmark', 'NYU', 'public', 1100000, 'Apache 2.0', '2024-05-02', false],
      ['DS-009', 'HumanEval', 'OpenAI', 'public', 164, 'MIT', '2024-05-15', false],
      ['DS-010', 'Anthropic-HH-RLHF', 'Anthropic', 'public', 161000, 'MIT', '2024-06-08', false],
      ['DS-011', 'PILE-CC', 'EleutherAI', 'public', 380000000, 'MIT', '2024-06-21', false],
      ['DS-012', 'CIFAR-100', 'CIFAR', 'public', 60000, 'MIT', '2024-07-07', false],
      ['DS-013', 'eu-gdpr-customer-pii-2024', 'In-house', 'pii', 2300000, 'Proprietary', '2024-09-03', true],
      ['DS-014', 'WMT24-en-de', 'WMT Workshop', 'public', 1450000, 'CC-BY 4.0', '2024-09-14', false],
      ['DS-015', 'fairface', 'Karkkainen et al.', 'public', 108501, 'CC-BY 4.0', '2024-10-02', false],
    ];
    for (const r of datasets) {
      await client.query(
        `INSERT INTO datasets (dataset_id, name, source, sensitivity, size_rows, license, registered_at, pii_present)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        r
      );
    }
    console.log(`Inserted ${datasets.length} datasets.`);

    // ---------- 15 EVALUATIONS ----------
    const evaluations = [
      ['EVAL-001', 'gpt-4o', 'HumanEval', 'pass@1', 0.902, '2024-09-15', true],
      ['EVAL-002', 'claude-3-haiku', 'GLUE benchmark', 'accuracy', 0.871, '2024-04-22', true],
      ['EVAL-003', 'llama-3-70b-instruct', 'MMLU', 'accuracy', 0.792, '2024-05-20', true],
      ['EVAL-004', 'mistral-large', 'WMT24-en-de', 'BLEU', 0.413, '2024-08-04', true],
      ['EVAL-005', 'gemini-1.5-pro', 'fairface', 'demographic_parity', 0.067, '2024-07-01', true],
      ['EVAL-006', 'claude-3-5-sonnet', 'HumanEval', 'pass@1', 0.921, '2024-10-26', true],
      ['EVAL-007', 'gpt-4o-mini', 'GLUE benchmark', 'accuracy', 0.823, '2024-07-23', true],
      ['EVAL-008', 'llama-3-8b-instruct', 'MMLU', 'accuracy', 0.681, '2024-05-01', true],
      ['EVAL-009', 'codestral-22b', 'HumanEval', 'pass@1', 0.812, '2024-05-30', true],
      ['EVAL-010', 'phi-3-medium', 'MMLU', 'accuracy', 0.785, '2024-05-23', true],
      ['EVAL-011', 'whisper-large-v3', 'CommonVoice 17', 'WER', 0.058, '2024-02-16', true],
      ['EVAL-012', 'dall-e-3', 'internal-bias-eval', 'demographic_parity', 0.214, '2024-03-05', false],
      ['EVAL-013', 'stable-diffusion-xl', 'fairface', 'demographic_parity', 0.187, '2024-01-21', false],
      ['EVAL-014', 'qwen2-72b-instruct', 'MMLU', 'accuracy', 0.741, '2024-06-08', true],
      ['EVAL-015', 'internal-fraud-classifier', 'internal-claims-2024', 'AUROC', 0.943, '2024-09-02', true],
    ];
    for (const r of evaluations) {
      await client.query(
        `INSERT INTO evaluations (eval_id, model, dataset, metric, score, run_at, passed)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        r
      );
    }
    console.log(`Inserted ${evaluations.length} evaluations.`);

    // ---------- 15 DEPLOYMENTS ----------
    const deployments = [
      ['DEP-001', 'gpt-4o', 'production', 'eu-west-1', '2024-08-06', '2024-09-12', 'platform-team'],
      ['DEP-002', 'claude-3-haiku', 'production', 'us-east-1', '20240307', '2024-04-21', 'cx-team'],
      ['DEP-003', 'llama-3-70b-instruct', 'staging', 'eu-central-1', '3.0', '2024-05-18', 'platform-team'],
      ['DEP-004', 'mistral-large', 'production', 'eu-west-3', '24.07', '2024-08-02', 'platform-team'],
      ['DEP-005', 'gemini-1.5-pro', 'production', 'us-central1', '001', '2024-06-30', 'data-team'],
      ['DEP-006', 'claude-3-5-sonnet', 'production', 'us-east-1', '20241022', '2024-10-25', 'cx-team'],
      ['DEP-007', 'gpt-4o-mini', 'production', 'eu-west-1', '2024-07-18', '2024-07-22', 'platform-team'],
      ['DEP-008', 'llama-3-8b-instruct', 'deprecated', 'eu-central-1', '3.0', '2024-04-30', 'platform-team'],
      ['DEP-009', 'codestral-22b', 'staging', 'eu-west-3', '22B-v0.1', '2024-05-29', 'devtools-team'],
      ['DEP-010', 'phi-3-medium', 'production', 'us-west-2', '4k-instruct', '2024-05-22', 'platform-team'],
      ['DEP-011', 'whisper-large-v3', 'production', 'us-east-1', 'v3', '2024-02-15', 'voice-team'],
      ['DEP-012', 'dall-e-3', 'restricted', 'us-east-1', '3.0', '2024-03-04', 'creative-team'],
      ['DEP-013', 'stable-diffusion-xl', 'production', 'eu-west-1', '1.0', '2024-01-20', 'creative-team'],
      ['DEP-014', 'qwen2-72b-instruct', 'pilot', 'ap-southeast-1', '2.0', '2024-06-07', 'research-team'],
      ['DEP-015', 'internal-fraud-classifier', 'production', 'eu-west-1', '2.4.1', '2024-09-01', 'risk-team'],
    ];
    for (const r of deployments) {
      await client.query(
        `INSERT INTO deployments (deployment_id, model, env, region, version, deployed_at, owner)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        r
      );
    }
    console.log(`Inserted ${deployments.length} deployments.`);

    // ---------- 15 AUDIT LOGS ----------
    const auditLogs = [
      ['LOG-001', 'alice.chen@corp.io', 'model.deploy', 'gpt-4o', '2024-09-12 10:14:22', '2024-08-06'],
      ['LOG-002', 'ben.osei@corp.io', 'model.deploy', 'claude-3-haiku', '2024-04-21 08:02:11', '20240307'],
      ['LOG-003', 'priya.rao@corp.io', 'model.evaluate', 'llama-3-70b-instruct', '2024-05-20 17:41:09', '3.0'],
      ['LOG-004', 'felix.koch@corp.io', 'policy.publish', 'EU-AI-ACT-RISK-POLICY-v1', '2024-08-09 12:00:00', null],
      ['LOG-005', 'sara.lopez@corp.io', 'incident.open', 'gemini-1.5-pro', '2024-09-30 22:18:55', '001'],
      ['LOG-006', 'alice.chen@corp.io', 'dataset.register', 'eu-gdpr-customer-pii-2024', '2024-09-03 09:30:00', null],
      ['LOG-007', 'ben.osei@corp.io', 'model.deprecate', 'llama-3-8b-instruct', '2024-10-12 15:22:00', '3.0'],
      ['LOG-008', 'priya.rao@corp.io', 'evaluation.fail', 'dall-e-3', '2024-03-05 11:09:33', '3.0'],
      ['LOG-009', 'felix.koch@corp.io', 'risk.update', 'RISK-007', '2024-09-21 14:11:00', null],
      ['LOG-010', 'sara.lopez@corp.io', 'model.restrict', 'internal-fraud-classifier', '2024-09-02 16:48:21', '2.4.1'],
      ['LOG-011', 'alice.chen@corp.io', 'policy.review', 'NIST-AI-RMF-MAP-v1', '2024-10-04 10:00:00', null],
      ['LOG-012', 'ben.osei@corp.io', 'incident.close', 'mistral-large', '2024-08-29 09:14:00', '24.07'],
      ['LOG-013', 'priya.rao@corp.io', 'model.evaluate', 'claude-3-5-sonnet', '2024-10-26 19:00:00', '20241022'],
      ['LOG-014', 'felix.koch@corp.io', 'deployment.rollback', 'gpt-4o-mini', '2024-08-15 22:30:00', '2024-07-18'],
      ['LOG-015', 'sara.lopez@corp.io', 'policy.publish', 'ISO-42001-AIMS-v2', '2024-10-12 11:11:11', null],
    ];
    for (const r of auditLogs) {
      await client.query(
        `INSERT INTO audit_logs (log_id, actor, action, target, timestamp, model_version)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        r
      );
    }
    console.log(`Inserted ${auditLogs.length} audit logs.`);

    // ---------- 15 POLICIES ----------
    const policies = [
      ['POL-001', 'EU AI Act – High-Risk System Conformity Assessment', 'EU_AI_Act', 'all production high-risk models', 'published', 'felix.koch@corp.io'],
      ['POL-002', 'EU AI Act – Prohibited Practices Screen', 'EU_AI_Act', 'all models', 'published', 'felix.koch@corp.io'],
      ['POL-003', 'EU AI Act – GPAI Transparency Obligations', 'EU_AI_Act', 'general-purpose models', 'published', 'alice.chen@corp.io'],
      ['POL-004', 'NIST AI RMF – GOVERN function', 'NIST_RMF', 'organization-wide', 'published', 'sara.lopez@corp.io'],
      ['POL-005', 'NIST AI RMF – MAP function', 'NIST_RMF', 'all in-scope AI systems', 'published', 'sara.lopez@corp.io'],
      ['POL-006', 'NIST AI RMF – MEASURE function', 'NIST_RMF', 'production systems', 'review', 'priya.rao@corp.io'],
      ['POL-007', 'NIST AI RMF – MANAGE function', 'NIST_RMF', 'production systems', 'draft', 'priya.rao@corp.io'],
      ['POL-008', 'ISO/IEC 42001 – AI Management System charter', 'ISO_42001', 'AIMS-scope', 'published', 'ben.osei@corp.io'],
      ['POL-009', 'ISO/IEC 42001 – AI risk treatment procedure', 'ISO_42001', 'AIMS-scope', 'published', 'ben.osei@corp.io'],
      ['POL-010', 'ISO/IEC 42001 – Data quality and lineage', 'ISO_42001', 'datasets', 'review', 'alice.chen@corp.io'],
      ['POL-011', 'EU AI Act – Post-market monitoring plan', 'EU_AI_Act', 'high-risk models', 'draft', 'felix.koch@corp.io'],
      ['POL-012', 'NIST AI RMF – Incident reporting threshold', 'NIST_RMF', 'production systems', 'published', 'sara.lopez@corp.io'],
      ['POL-013', 'ISO/IEC 42001 – Vendor and third-party model controls', 'ISO_42001', 'third-party providers', 'draft', 'ben.osei@corp.io'],
      ['POL-014', 'EU AI Act – Human oversight specification', 'EU_AI_Act', 'high-risk models', 'published', 'alice.chen@corp.io'],
      ['POL-015', 'NIST AI RMF – Bias and validity testing baseline', 'NIST_RMF', 'all in-scope AI systems', 'published', 'priya.rao@corp.io'],
    ];
    for (const r of policies) {
      await client.query(
        `INSERT INTO policies (policy_id, name, framework, scope, status, owner)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        r
      );
    }
    console.log(`Inserted ${policies.length} policies.`);

    // ---------- 15 INCIDENTS ----------
    const incidents = [
      ['INC-001', 'gemini-1.5-pro', 'bias', 'high', 'open', '2024-09-30 22:18:55', 'Demographic disparity detected on fairface eval; female-coded subgroup mis-classified at 2.4x baseline rate.'],
      ['INC-002', 'gpt-4o', 'hallucination', 'medium', 'investigating', '2024-10-04 11:02:00', 'Customer-facing assistant produced fabricated regulatory citation in EU-zone tenant.'],
      ['INC-003', 'dall-e-3', 'bias', 'high', 'mitigating', '2024-03-05 11:09:33', 'Internal bias evaluation failed demographic parity threshold (0.214 vs <0.10 target).'],
      ['INC-004', 'claude-3-haiku', 'drift', 'low', 'closed', '2024-06-12 09:00:00', 'Slow performance drift on intent-classification head; KS-statistic 0.07.'],
      ['INC-005', 'mistral-large', 'security', 'high', 'closed', '2024-08-29 09:14:00', 'Prompt-injection chain exfiltrated tool-call history; patched via output filter v3.'],
      ['INC-006', 'llama-3-70b-instruct', 'hallucination', 'medium', 'open', '2024-10-09 14:55:21', 'RAG pipeline hallucinated source URIs when context window exceeded 110k tokens.'],
      ['INC-007', 'stable-diffusion-xl', 'bias', 'medium', 'mitigating', '2024-04-18 16:21:00', 'Occupation prompts skewed toward male-coded depictions (delta 0.22).'],
      ['INC-008', 'internal-fraud-classifier', 'drift', 'high', 'investigating', '2024-10-30 08:45:00', 'AUROC dropped from 0.943 to 0.871 over 30 days; suspected upstream feature drift.'],
      ['INC-009', 'phi-3-medium', 'security', 'medium', 'closed', '2024-07-02 13:00:00', 'Jailbreak via system-prompt leak; mitigated via prompt-isolation middleware.'],
      ['INC-010', 'qwen2-72b-instruct', 'hallucination', 'low', 'open', '2024-10-20 19:30:00', 'Pilot users reported confident but wrong answers on finance-policy questions.'],
      ['INC-011', 'gpt-4o-mini', 'drift', 'low', 'closed', '2024-09-25 10:00:00', 'Embedding-space drift on product taxonomy; re-trained adapter.'],
      ['INC-012', 'whisper-large-v3', 'bias', 'medium', 'mitigating', '2024-05-04 12:30:00', 'WER for AAVE speakers 2.1x baseline; corrective fine-tune scheduled.'],
      ['INC-013', 'codestral-22b', 'security', 'low', 'closed', '2024-06-17 17:00:00', 'Code-completion suggested vulnerable crypto call; rule added to lint.'],
      ['INC-014', 'claude-3-5-sonnet', 'hallucination', 'low', 'investigating', '2024-11-01 09:00:00', 'Sporadic tool-use hallucination in long agent traces; under triage.'],
      ['INC-015', 'gemini-1.5-pro', 'drift', 'medium', 'open', '2024-11-04 14:00:00', 'PSI=0.31 detected on retrieval-grounded QA tenant; investigating data shift.'],
    ];
    for (const r of incidents) {
      await client.query(
        `INSERT INTO incidents (incident_id, model, type, severity, status, opened_at, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        r
      );
    }
    console.log(`Inserted ${incidents.length} incidents.`);

    // ---------- 15 RISK REGISTER ----------
    const risks = [
      ['RISK-001', 'Bias / Fairness', 'Image-generation models exhibit demographic disparity on occupation prompts.', 'medium', 'high', 'Quarterly bias audit + prompt-debiasing layer; block deploy if delta>0.15.', 'priya.rao@corp.io'],
      ['RISK-002', 'Data Privacy', 'PII present in fine-tuning corpus may leak via memorization.', 'medium', 'high', 'Dedup + canary-token memorization tests pre-release; DPIA for any PII-tagged dataset.', 'ben.osei@corp.io'],
      ['RISK-003', 'Hallucination', 'Customer-facing assistants generate plausible but false regulatory claims.', 'high', 'high', 'Retrieval-grounded prompting + confidence-gated answer suppression for legal/medical.', 'alice.chen@corp.io'],
      ['RISK-004', 'Model Drift', 'Production classifiers degrade silently between scheduled evaluations.', 'high', 'medium', 'Daily drift monitor (PSI, KS); auto-page on threshold breach.', 'sara.lopez@corp.io'],
      ['RISK-005', 'Prompt Injection / Tool Abuse', 'Agent stack vulnerable to tool-call exfiltration via untrusted content.', 'medium', 'high', 'Output filter v3 + tool allow-list + structured-output validator.', 'felix.koch@corp.io'],
      ['RISK-006', 'EU AI Act Non-Conformity', 'High-risk system shipped without conformity assessment.', 'low', 'high', 'CI gate blocks production deploy unless POL-001 checklist signed.', 'felix.koch@corp.io'],
      ['RISK-007', 'Third-Party Model Lock-In', 'Reliance on a single closed-weights provider creates continuity risk.', 'high', 'medium', 'Maintain at least one open-weights fallback per critical use-case.', 'ben.osei@corp.io'],
      ['RISK-008', 'Copyright / IP', 'Training data with ambiguous license may trigger downstream IP claims.', 'medium', 'medium', 'Dataset license registry + legal review for any non-permissive license.', 'alice.chen@corp.io'],
      ['RISK-009', 'Energy / Carbon', 'Large-model inference cost exceeds sustainability budget.', 'medium', 'low', 'Route low-stakes traffic to small models; quarterly carbon report.', 'priya.rao@corp.io'],
      ['RISK-010', 'Human Oversight Gap', 'High-risk decisions executed without human-in-the-loop checkpoint.', 'low', 'high', 'POL-014 enforces HITL for credit/medical/employment decisions.', 'sara.lopez@corp.io'],
      ['RISK-011', 'Security – Supply Chain', 'Third-party model weights tampered with via compromised registry.', 'low', 'high', 'Pin model digest + verify signatures pre-load.', 'felix.koch@corp.io'],
      ['RISK-012', 'Regulatory Reporting Delay', 'Serious incidents not reported within EU AI Act 15-day window.', 'medium', 'high', 'Incident workflow auto-files draft notification on severity=high.', 'sara.lopez@corp.io'],
      ['RISK-013', 'Vendor Data Use', 'Provider may retain prompts for training without opt-out.', 'medium', 'medium', 'Use ZDR / opt-out endpoints; record in vendor DPA.', 'ben.osei@corp.io'],
      ['RISK-014', 'Evaluation Coverage Gap', 'Underrepresented languages/dialects not evaluated.', 'high', 'medium', 'Expand eval suite to top-20 EU languages by Q2.', 'priya.rao@corp.io'],
      ['RISK-015', 'Unacceptable-Risk Misclassification', 'A use-case slips into "unacceptable" tier without review.', 'low', 'high', 'Risk-tier classification required at intake; quarterly re-review.', 'alice.chen@corp.io'],
    ];
    for (const r of risks) {
      await client.query(
        `INSERT INTO risk_register (risk_id, category, description, likelihood, impact, mitigation, owner)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        r
      );
    }
    console.log(`Inserted ${risks.length} risks.`);

    // ---------- 10 MODEL CARDS ----------
    const cards = [
      ['MC-001', 'gpt-4o', '2024-08-06', 'alice.chen@corp.io', 'Customer support + RAG QA', 'Hallucination on long contexts; weak on under-represented languages', 'Avoid sole decision-maker for credit/medical; HITL required'],
      ['MC-002', 'claude-3-5-sonnet', '20241022', 'alice.chen@corp.io', 'Internal coding copilot', 'May suggest deprecated APIs', 'Code review mandatory before merge'],
      ['MC-003', 'gemini-1.5-pro', '001', 'sara.lopez@corp.io', 'Document QA over GDPR corpus', 'Embedding drift on legal terminology', 'PII redaction required pre-prompt'],
      ['MC-004', 'mistral-large', '24.07', 'felix.koch@corp.io', 'Multilingual ticket routing', 'WER for AAVE 2x baseline', 'Quarterly fairness audit'],
      ['MC-005', 'llama-3-70b-instruct', '3.0', 'priya.rao@corp.io', 'Internal RAG benchmark', 'Context > 110k tokens causes URI hallucination', 'Limit context window to 100k'],
      ['MC-006', 'dall-e-3', '3.0', 'ben.osei@corp.io', 'Marketing imagery', 'Demographic skew on occupation prompts', 'Use prompt-debiasing wrapper'],
      ['MC-007', 'whisper-large-v3', 'v3', 'alice.chen@corp.io', 'Call-centre transcription', 'WER for AAVE elevated', 'Corrective fine-tune in progress'],
      ['MC-008', 'internal-fraud-classifier', '2.4.1', 'sara.lopez@corp.io', 'Claims fraud scoring', 'Drift observed in latest quarter', 'HITL required for adverse decisions'],
      ['MC-009', 'stable-diffusion-xl', '1.0', 'priya.rao@corp.io', 'Concept art generation', 'Occupation-prompt skew', 'Restricted to internal use'],
      ['MC-010', 'codestral-22b', '22B-v0.1', 'felix.koch@corp.io', 'Code completion', 'May propose vulnerable crypto patterns', 'Lint guard rules enforced'],
    ];
    for (const r of cards) {
      await client.query(
        `INSERT INTO model_cards (card_id, model, version, owners, intended_use, limitations, ethical_considerations)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        r
      );
    }
    console.log(`Inserted ${cards.length} model cards.`);

    // ---------- 10 PROMPTS ----------
    const prompts = [
      ['PR-001', 'cx-support-system', 'You are a customer-support assistant. Be concise and never fabricate policies.', 'Customer says: {{message}}', '1.4', 'alice.chen@corp.io', '2024-11-01'],
      ['PR-002', 'fraud-explain', 'You explain fraud-model decisions in plain English to claims agents.', 'Score: {{score}}; features: {{features}}', '0.9', 'sara.lopez@corp.io', '2024-10-29'],
      ['PR-003', 'policy-drafter', 'You draft AI governance policies aligned to ISO 42001.', 'Topic: {{topic}}', '2.1', 'felix.koch@corp.io', '2024-11-02'],
      ['PR-004', 'bias-audit', 'You audit model outputs for bias against the fairness rubric.', 'Outputs: {{outputs}}', '1.0', 'priya.rao@corp.io', '2024-10-25'],
      ['PR-005', 'code-review', 'You review code for security and correctness.', 'Diff: {{diff}}', '1.2', 'ben.osei@corp.io', '2024-11-04'],
      ['PR-006', 'incident-triage', 'You triage AI incidents per the on-call runbook.', 'Incident: {{description}}', '1.1', 'sara.lopez@corp.io', '2024-11-03'],
      ['PR-007', 'rag-qa', 'Ground every answer in retrieved passages. Refuse if no passage applies.', 'Question: {{q}} Passages: {{passages}}', '3.0', 'alice.chen@corp.io', '2024-11-05'],
      ['PR-008', 'translation-de', 'Translate to formal German preserving compliance terminology.', 'Text: {{text}}', '1.0', 'felix.koch@corp.io', '2024-10-15'],
      ['PR-009', 'image-caption', 'Caption marketing images in inclusive language.', 'Image: {{image}}', '0.5', 'ben.osei@corp.io', '2024-10-09'],
      ['PR-010', 'red-team-jailbreak', 'You are a red-team auditor probing for jailbreaks.', 'Target prompt: {{prompt}}', '0.3', 'priya.rao@corp.io', '2024-11-01'],
    ];
    for (const r of prompts) {
      await client.query(
        `INSERT INTO prompts (prompt_id, name, system, user_template, version, owner, last_used)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        r
      );
    }
    console.log(`Inserted ${prompts.length} prompts.`);

    // ---------- 10 SSP ----------
    const ssps = [
      ['SSP-001', 'customer-support-rag', 'NIST_RMF', 'approved', 'alice.chen@corp.io', '2.0'],
      ['SSP-002', 'fraud-classifier', 'NIST_RMF', 'approved', 'sara.lopez@corp.io', '1.4'],
      ['SSP-003', 'marketing-imagery', 'ISO_42001', 'draft', 'ben.osei@corp.io', '0.9'],
      ['SSP-004', 'compliance-copilot', 'ISO_42001', 'approved', 'felix.koch@corp.io', '1.2'],
      ['SSP-005', 'voice-transcription', 'NIST_RMF', 'expired', 'alice.chen@corp.io', '0.7'],
      ['SSP-006', 'code-assistant', 'ISO_42001', 'approved', 'ben.osei@corp.io', '1.0'],
      ['SSP-007', 'multilingual-router', 'NIST_RMF', 'draft', 'felix.koch@corp.io', '0.5'],
      ['SSP-008', 'document-qa', 'ISO_42001', 'approved', 'sara.lopez@corp.io', '1.1'],
      ['SSP-009', 'image-classifier', 'NIST_RMF', 'draft', 'priya.rao@corp.io', '0.3'],
      ['SSP-010', 'rag-internal-kb', 'ISO_42001', 'approved', 'alice.chen@corp.io', '1.5'],
    ];
    for (const r of ssps) {
      await client.query(
        `INSERT INTO ssp (ssp_id, system_name, framework, status, owner, version) VALUES ($1,$2,$3,$4,$5,$6)`,
        r
      );
    }
    console.log(`Inserted ${ssps.length} SSPs.`);

    // ---------- 10 DPIA ----------
    const dpias = [
      ['DPIA-001', 'customer-support-rag', 'Tier-1 customer chat across EU', 'name,email,ticket-history', 'PII redaction, ZDR vendor flag', 'low', 'felix.koch@corp.io', '2024-09-10'],
      ['DPIA-002', 'fraud-classifier', 'Claims fraud scoring', 'name,claim,SSN-tail', 'Pseudonymisation, HITL gate', 'medium', 'sara.lopez@corp.io', '2024-08-22'],
      ['DPIA-003', 'voice-transcription', 'Call-centre recordings', 'voice,name,phone', 'Encrypted at rest, 30-day TTL', 'medium', 'alice.chen@corp.io', '2024-07-04'],
      ['DPIA-004', 'document-qa', 'GDPR doc corpus', 'employee notes', 'Role-based retrieval filter', 'low', 'ben.osei@corp.io', '2024-09-30'],
      ['DPIA-005', 'marketing-imagery', 'Generated marketing imagery', 'none (synthetic)', 'Bias filter, watermarking', 'low', 'priya.rao@corp.io', '2024-10-15'],
      ['DPIA-006', 'compliance-copilot', 'Internal compliance Q&A', 'employee, audit logs', 'No cross-tenant leakage', 'low', 'felix.koch@corp.io', '2024-10-01'],
      ['DPIA-007', 'rag-internal-kb', 'Confidential KB grounding', 'employee, finance docs', 'ACL-aware retrieval', 'medium', 'alice.chen@corp.io', '2024-09-18'],
      ['DPIA-008', 'image-classifier', 'Document-image OCR', 'scans of contracts', 'On-prem inference', 'medium', 'priya.rao@corp.io', '2024-08-05'],
      ['DPIA-009', 'code-assistant', 'Code suggestions', 'source code', 'Self-hosted; no telemetry', 'low', 'ben.osei@corp.io', '2024-07-22'],
      ['DPIA-010', 'multilingual-router', 'Ticket routing across locales', 'customer email', 'PII redaction pre-prompt', 'low', 'felix.koch@corp.io', '2024-08-15'],
    ];
    for (const r of dpias) {
      await client.query(
        `INSERT INTO dpia_records (dpia_id, system, scope, data_categories, mitigations, residual_risk, approved_by, approved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        r
      );
    }
    console.log(`Inserted ${dpias.length} DPIAs.`);

    // ---------- 10 RED-TEAM FINDINGS ----------
    const rt = [
      ['RT-001', 'gpt-4o', 'role-playing jailbreak', 'medium', 'mitigated', '2024-08-10'],
      ['RT-002', 'claude-3-5-sonnet', 'indirect prompt injection via PDF', 'high', 'open', '2024-09-22'],
      ['RT-003', 'gemini-1.5-pro', 'multi-turn obfuscation', 'medium', 'mitigated', '2024-07-18'],
      ['RT-004', 'mistral-large', 'translation-detour exfiltration', 'low', 'accepted', '2024-08-30'],
      ['RT-005', 'dall-e-3', 'NSFW jailbreak via base64', 'high', 'mitigated', '2024-06-04'],
      ['RT-006', 'stable-diffusion-xl', 'celebrity-likeness extraction', 'high', 'open', '2024-10-12'],
      ['RT-007', 'codestral-22b', 'malware-snippet completion', 'medium', 'mitigated', '2024-09-05'],
      ['RT-008', 'internal-fraud-classifier', 'feature-poisoning probe', 'critical', 'open', '2024-10-30'],
      ['RT-009', 'whisper-large-v3', 'phonetic prompt injection', 'medium', 'open', '2024-09-15'],
      ['RT-010', 'phi-3-medium', 'system-prompt leak', 'medium', 'mitigated', '2024-07-02'],
    ];
    for (const r of rt) {
      await client.query(
        `INSERT INTO redteam_findings (finding_id, model, technique, severity, status, found_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        r
      );
    }
    console.log(`Inserted ${rt.length} red-team findings.`);

    // ---------- 10 THIRD PARTIES ----------
    const parties = [
      ['TP-001', 'OpenAI Inc.', 'processor', true, '2025-09-30'],
      ['TP-002', 'Anthropic PBC', 'processor', true, '2025-12-31'],
      ['TP-003', 'AWS Bedrock', 'sub-processor', false, '2026-06-30'],
      ['TP-004', 'Mistral AI SAS', 'processor', true, '2025-08-15'],
      ['TP-005', 'Google Cloud AI', 'sub-processor', false, '2026-03-12'],
      ['TP-006', 'Pinecone Systems', 'sub-processor', false, '2025-10-04'],
      ['TP-007', 'Datadog Inc.', 'processor', false, '2026-01-20'],
      ['TP-008', 'Snowflake Inc.', 'processor', true, '2026-04-30'],
      ['TP-009', 'LangChain Inc.', 'integrator', false, '2025-11-30'],
      ['TP-010', 'HuggingFace', 'integrator', false, '2025-12-15'],
    ];
    for (const r of parties) {
      await client.query(
        `INSERT INTO third_parties (party_id, name, role, dpia_required, contract_expires) VALUES ($1,$2,$3,$4,$5)`,
        r
      );
    }
    console.log(`Inserted ${parties.length} third parties.`);

    // ---------- 10 TRAINING RUNS ----------
    const runs = [
      ['TR-001', 'internal-fraud-classifier', 'internal-claims-2024', 36.5, 8, 4800.00, 'complete', '2024-09-01'],
      ['TR-002', 'embedding-en-v2', 'CommonCrawl-2024-26', 120.0, 32, 18400.00, 'complete', '2024-07-12'],
      ['TR-003', 'fraud-classifier-v3-experimental', 'internal-claims-2024', 12.3, 4, 1600.00, 'failed', '2024-10-05'],
      ['TR-004', 'support-router-en', 'GLUE benchmark', 8.4, 2, 720.00, 'complete', '2024-08-18'],
      ['TR-005', 'voice-asr-de', 'CommonVoice 17', 48.0, 8, 6400.00, 'complete', '2024-05-10'],
      ['TR-006', 'rag-encoder-v1', 'PILE-CC', 96.0, 16, 12800.00, 'complete', '2024-06-20'],
      ['TR-007', 'image-classifier-doc', 'ImageNet-1k', 24.0, 8, 3200.00, 'complete', '2024-04-04'],
      ['TR-008', 'reward-model-rlhf', 'Anthropic-HH-RLHF', 18.5, 4, 2400.00, 'complete', '2024-08-30'],
      ['TR-009', 'embedding-multilingual', 'WMT24-en-de', 72.0, 16, 9600.00, 'failed', '2024-09-12'],
      ['TR-010', 'fairface-debias-adapter', 'fairface', 6.0, 2, 480.00, 'complete', '2024-10-02'],
    ];
    for (const r of runs) {
      await client.query(
        `INSERT INTO training_runs (run_id, model, dataset, hours, gpu_count, cost_usd, status, finished_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        r
      );
    }
    console.log(`Inserted ${runs.length} training runs.`);

    // ---------- 10 FINE TUNES ----------
    const fts = [
      ['FT-001', 'llama-3-8b-instruct', 'Anthropic-HH-RLHF', 'TR-008', 0.872, 'promoted'],
      ['FT-002', 'phi-3-medium', 'GLUE benchmark', 'TR-004', 0.834, 'sandbox'],
      ['FT-003', 'whisper-large-v3', 'CommonVoice 17', 'TR-005', 0.061, 'promoted'],
      ['FT-004', 'mistral-large', 'WMT24-en-de', 'TR-009', 0.412, 'rolled_back'],
      ['FT-005', 'internal-fraud-classifier', 'internal-claims-2024', 'TR-001', 0.943, 'promoted'],
      ['FT-006', 'codestral-22b', 'HumanEval', null, 0.814, 'sandbox'],
      ['FT-007', 'stable-diffusion-xl', 'fairface', 'TR-010', 0.187, 'sandbox'],
      ['FT-008', 'qwen2-72b-instruct', 'MMLU', null, 0.741, 'sandbox'],
      ['FT-009', 'gemini-1.5-pro', 'eu-gdpr-customer-pii-2024', null, 0.918, 'rolled_back'],
      ['FT-010', 'gpt-4o-mini', 'OpenWebText2', null, 0.823, 'promoted'],
    ];
    for (const r of fts) {
      await client.query(
        `INSERT INTO fine_tunes (ft_id, base_model, dataset, run_id, eval_score, status) VALUES ($1,$2,$3,$4,$5,$6)`,
        r
      );
    }
    console.log(`Inserted ${fts.length} fine-tunes.`);

    // ---------- 12 CONTROLS ----------
    const controls = [
      ['CTRL-001', 'EU_AI_Act', 'Art.9',     'Risk management system', 'felix.koch@corp.io', 'implemented', '2024-10-01'],
      ['CTRL-002', 'EU_AI_Act', 'Art.10',    'Data and data governance', 'alice.chen@corp.io', 'partial', '2024-09-15'],
      ['CTRL-003', 'EU_AI_Act', 'Art.14',    'Human oversight', 'sara.lopez@corp.io', 'implemented', '2024-10-12'],
      ['CTRL-004', 'EU_AI_Act', 'Art.15',    'Accuracy, robustness, cybersecurity', 'felix.koch@corp.io', 'partial', '2024-09-22'],
      ['CTRL-005', 'NIST_RMF',  'GOVERN-1.1','Roles and responsibilities', 'sara.lopez@corp.io', 'implemented', '2024-09-30'],
      ['CTRL-006', 'NIST_RMF',  'MAP-2.3',   'Impact assessment', 'priya.rao@corp.io', 'partial', '2024-08-12'],
      ['CTRL-007', 'NIST_RMF',  'MEASURE-2.1','Test, evaluate, validate', 'priya.rao@corp.io', 'implemented', '2024-10-04'],
      ['CTRL-008', 'NIST_RMF',  'MANAGE-1.2','Incident response', 'sara.lopez@corp.io', 'missing', '2024-07-01'],
      ['CTRL-009', 'ISO_42001', '6.1.2',     'AI risk treatment', 'ben.osei@corp.io', 'implemented', '2024-09-01'],
      ['CTRL-010', 'ISO_42001', '8.2',       'Data quality management', 'alice.chen@corp.io', 'partial', '2024-08-20'],
      ['CTRL-011', 'ISO_42001', 'A.6.2.3',   'AI system testing', 'priya.rao@corp.io', 'implemented', '2024-10-11'],
      ['CTRL-012', 'ISO_42001', 'A.9.4',     'Third-party model governance', 'ben.osei@corp.io', 'missing', '2024-06-30'],
    ];
    for (const r of controls) {
      await client.query(
        `INSERT INTO controls (control_id, framework, control_id_ext, title, owner, status, last_tested)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        r
      );
    }
    console.log(`Inserted ${controls.length} controls.`);

    // ---------- 10 JURISDICTIONS ----------
    const juris = [
      ['JR-001', 'European Union', 'EU_AI_Act', 'all high-risk EU-facing systems', 'gap'],
      ['JR-002', 'United Kingdom', 'UK_AISA', 'all UK-facing systems', 'under_review'],
      ['JR-003', 'United States', 'US_EO_14110', 'federal-contractor systems', 'compliant'],
      ['JR-004', 'Canada', 'AIDA', 'high-impact systems', 'gap'],
      ['JR-005', 'Brazil', 'PL-2338', 'systems for Brazilian residents', 'under_review'],
      ['JR-006', 'China', 'GenAI Measures', 'generative systems', 'gap'],
      ['JR-007', 'Japan', 'METI AI Guidelines', 'all systems', 'compliant'],
      ['JR-008', 'Singapore', 'AI Verify', 'pilot systems', 'compliant'],
      ['JR-009', 'Australia', 'eSafety Framework', 'consumer-facing systems', 'under_review'],
      ['JR-010', 'India', 'DPDP Act', 'systems processing IN data', 'gap'],
    ];
    for (const r of juris) {
      await client.query(
        `INSERT INTO jurisdictions (juris_id, country, regulation, applicable_systems, status) VALUES ($1,$2,$3,$4,$5)`,
        r
      );
    }
    console.log(`Inserted ${juris.length} jurisdictions.`);

    // ---------- 1 demo webhook ----------
    await client.query(
      `INSERT INTO webhooks (webhook_id, url, secret, events, active)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      ['WH-DEMO', 'https://example.invalid/aigov-webhook', 'demo-secret', 'incident.opened,eval.failed,control.test.failed,ai.alert,redteam.finding.high', true]
    );

    // ---------- 3 demo notifications ----------
    const notifs = [
      [null, 'incident.opened', 'Demo: incident opened', 'PSI=0.31 detected on retrieval-grounded QA tenant', 'incidents', 'INC-015'],
      [null, 'eval.failed',     'Demo: evaluation failed', 'dall-e-3 / internal-bias-eval / demographic_parity', 'evaluations', 'EVAL-012'],
      [null, 'control.test.failed', 'Demo: control missing', 'MANAGE-1.2 incident response — no evidence on file', 'controls', 'CTRL-008'],
    ];
    for (const n of notifs) {
      await client.query(
        `INSERT INTO notifications (user_email, kind, title, body, resource, resource_id) VALUES ($1,$2,$3,$4,$5,$6)`,
        n
      );
    }
    console.log(`Inserted ${notifs.length} demo notifications + 1 demo webhook.`);

    console.log('Seed complete.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

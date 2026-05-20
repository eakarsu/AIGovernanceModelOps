// OpenRouter AI service for AI Governance / Model Ops platform.
// Uses native fetch (Node 18+); falls back to https module if fetch unavailable.
const { OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_URL, APP_TITLE } = require('../config/openrouter');

const SYSTEM_PROMPT = `You are an AI governance, risk, and compliance expert.
You write for AI risk officers, compliance leads, and ML platform teams.
Cite EU AI Act Articles, NIST AI RMF functions (GOVERN / MAP / MEASURE / MANAGE),
and ISO/IEC 42001 clauses by name when relevant. Be specific and operational.
Always reply with valid JSON only — no prose around the JSON, no markdown fences.`;

async function callOpenRouter(userPrompt, { temperature = 0.4, maxTokens = 1800 } = {}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:3040',
      'X-Title': APP_TITLE,
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function safeJsonParse(text, fallback = {}) {
  if (text == null) return { ...fallback };
  if (typeof text === 'object') return text;
  const t = String(text).trim();
  try { return JSON.parse(t); } catch (_) {}
  // first balanced {...}
  const start = t.indexOf('{');
  if (start !== -1) {
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < t.length; i++) {
      const ch = t[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(t.slice(start, i + 1)); } catch (_) {}
          break;
        }
      }
    }
  }
  // fenced block
  const m = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (m && m[1]) { try { return JSON.parse(m[1].trim()); } catch (_) {} }
  return { ...fallback, summary: t };
}

// ---------- 1. Bias audit ----------
async function auditBias({ model, dataset, metric, score, notes }) {
  const prompt = `Audit a model for fairness/bias issues.
Input:
- Model: ${model || 'unspecified'}
- Dataset: ${dataset || 'unspecified'}
- Fairness metric: ${metric || 'demographic_parity'}
- Observed score / disparity: ${score || 'unknown'}
- Notes: ${notes || 'none'}

Return JSON:
{
  "overall_assessment": "pass" | "warning" | "fail",
  "disparity_summary": string,
  "affected_subgroups": [{ "subgroup": string, "metric": string, "observed": number, "baseline": number, "delta": number }],
  "eu_ai_act_references": [{ "article": string, "obligation": string }],
  "nist_rmf_functions": [{ "function": "GOVERN"|"MAP"|"MEASURE"|"MANAGE", "applies_to": string }],
  "iso_42001_clauses": [string],
  "recommended_actions": [{ "action": string, "owner_role": string, "priority": "high"|"medium"|"low" }],
  "ship_decision": "block" | "conditional" | "ship",
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt), { overall_assessment: 'warning' });
}

// ---------- 2. Drift detection ----------
async function detectDrift({ model, baselineMetric, currentMetric, window, signal }) {
  const prompt = `Analyze a production model for drift.
Input:
- Model: ${model || 'unspecified'}
- Baseline metric value: ${baselineMetric ?? 'unknown'}
- Current metric value: ${currentMetric ?? 'unknown'}
- Observation window: ${window || 'last 30 days'}
- Drift signal: ${signal || 'PSI'}

Return JSON:
{
  "drift_detected": boolean,
  "severity": "none"|"low"|"medium"|"high",
  "drift_type": "data"|"concept"|"label"|"prediction",
  "root_cause_hypotheses": [{ "hypothesis": string, "evidence": string, "confidence": number }],
  "statistical_signals": [{ "signal": string, "value": number, "threshold": number, "breached": boolean }],
  "recommended_actions": [{ "action": string, "owner_role": string, "priority": "high"|"medium"|"low" }],
  "retrain_recommendation": { "recommended": boolean, "rationale": string, "estimated_lead_time_days": number },
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt), { drift_detected: false });
}

// ---------- 3. Compliance mapping ----------
async function mapCompliance({ system, riskTier, framework, description }) {
  const prompt = `Map an AI system to the requested compliance framework.
Input:
- System: ${system || 'unspecified'}
- Risk tier (EU AI Act): ${riskTier || 'unknown'}
- Framework: ${framework || 'EU_AI_Act'}
- Description: ${description || 'none'}

Return JSON:
{
  "framework": "EU_AI_Act"|"NIST_RMF"|"ISO_42001",
  "applicable_controls": [{ "id": string, "title": string, "obligation": string, "current_status": "met"|"partial"|"gap"|"unknown" }],
  "gaps": [{ "control": string, "gap": string, "severity": "high"|"medium"|"low", "evidence_needed": [string] }],
  "evidence_artifacts": [{ "artifact": string, "produced_by": string, "review_cadence": string }],
  "conformity_assessment_path": string,
  "human_oversight_requirements": [string],
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt), { framework: framework || 'EU_AI_Act' });
}

// ---------- 4. Risk scoring ----------
async function scoreRisk({ useCase, dataSensitivity, autonomy, exposedPopulation, modality }) {
  const prompt = `Score the risk of an AI use-case.
Input:
- Use-case: ${useCase || 'unspecified'}
- Data sensitivity: ${dataSensitivity || 'unknown'}
- Autonomy level: ${autonomy || 'human-in-the-loop'}
- Exposed population: ${exposedPopulation || 'internal'}
- Modality: ${modality || 'text'}

Return JSON:
{
  "eu_ai_act_tier": "minimal"|"limited"|"high"|"unacceptable",
  "tier_rationale": string,
  "composite_risk_score": number,
  "risk_dimensions": [{ "dimension": string, "score": number, "rationale": string }],
  "controls_required": [{ "control": string, "framework": string, "priority": "high"|"medium"|"low" }],
  "human_oversight": { "level_required": string, "rationale": string },
  "monitoring_requirements": [string],
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt), { eu_ai_act_tier: 'limited' });
}

// ---------- 5. Policy drafting ----------
async function draftPolicy({ topic, framework, scope, owner }) {
  const prompt = `Draft an internal AI governance policy.
Input:
- Topic: ${topic || 'AI risk management'}
- Framework alignment: ${framework || 'ISO_42001'}
- Scope: ${scope || 'all production AI systems'}
- Owner: ${owner || 'Head of AI Governance'}

Return JSON:
{
  "title": string,
  "purpose": string,
  "scope": string,
  "definitions": [{ "term": string, "definition": string }],
  "policy_statements": [{ "id": string, "statement": string, "rationale": string }],
  "roles_and_responsibilities": [{ "role": string, "responsibilities": [string] }],
  "controls": [{ "control_id": string, "description": string, "evidence": string, "framework_ref": string }],
  "review_cadence": string,
  "exceptions_process": string,
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt, { maxTokens: 2200 }), { title: topic });
}

// ---------- 6. Incident triage ----------
async function triageIncident({ model, type, severity, description }) {
  const prompt = `Triage an AI incident.
Input:
- Model: ${model || 'unspecified'}
- Type: ${type || 'unknown'}
- Severity (reported): ${severity || 'unknown'}
- Description: ${description || 'none'}

Return JSON:
{
  "confirmed_severity": "low"|"medium"|"high"|"critical",
  "incident_class": "bias"|"drift"|"hallucination"|"security"|"privacy"|"other",
  "immediate_actions": [{ "action": string, "owner_role": string, "due_within_hours": number }],
  "containment_steps": [string],
  "regulatory_notification": { "required": boolean, "regimes": [string], "deadline": string, "draft_summary": string },
  "root_cause_hypotheses": [{ "hypothesis": string, "evidence_to_collect": [string] }],
  "communication_plan": { "internal": string, "external": string },
  "postmortem_required": boolean,
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt), { confirmed_severity: severity || 'medium' });
}

// ---------- 7. Explain decision (SHAP/LIME-style) ----------
async function explainDecision({ model_id, instance }) {
  const prompt = `Produce a SHAP/LIME-style local explanation for a single model decision.
Input:
- Model: ${model_id || 'unspecified'}
- Instance (features): ${JSON.stringify(instance || {})}

Return JSON:
{
  "method": "SHAP"|"LIME"|"hybrid",
  "predicted_class_or_value": string,
  "confidence": number,
  "feature_attributions": [{ "feature": string, "value": string, "contribution": number, "direction": "increases"|"decreases" }],
  "counterfactual": { "minimal_change": string, "expected_outcome": string },
  "trust_signals": [{ "signal": string, "value": string }],
  "human_review_required": boolean,
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt), { method: 'SHAP' });
}

// ---------- 8. Prompt-injection test ----------
async function promptInjectionTest({ prompt: target, target_model }) {
  const userPrompt = `Assess prompt-injection robustness for a target prompt + model.
Input:
- Target model: ${target_model || 'unspecified'}
- Target prompt:
"""${target || ''}"""

Return JSON:
{
  "injection_success_likelihood": number,
  "risk_rating": "low"|"medium"|"high"|"critical",
  "attack_vectors": [{ "vector": string, "example_payload": string, "expected_effect": string }],
  "owasp_llm_top10_refs": [string],
  "recommended_mitigations": [{ "control": string, "type": "input_filter"|"output_filter"|"system_prompt"|"tool_gating"|"sandbox", "priority": "high"|"medium"|"low" }],
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(userPrompt), { risk_rating: 'medium' });
}

// ---------- 9. Fairness curve (equal-opportunity) ----------
async function fairnessCurve({ model_id, sensitive_attr }) {
  const prompt = `Generate an equal-opportunity / fairness curve analysis.
Input:
- Model: ${model_id || 'unspecified'}
- Sensitive attribute: ${sensitive_attr || 'gender'}

Return JSON:
{
  "sensitive_attribute": string,
  "curve_points": [{ "threshold": number, "tpr_group_a": number, "tpr_group_b": number, "fpr_group_a": number, "fpr_group_b": number, "eo_gap": number }],
  "optimal_threshold": { "value": number, "eo_gap_at_threshold": number, "utility_at_threshold": number },
  "disparity_summary": string,
  "recommendations": [{ "action": string, "rationale": string, "priority": "high"|"medium"|"low" }],
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt), { sensitive_attribute: sensitive_attr });
}

// ---------- 10. Data lineage ----------
async function dataLineage({ model_id }) {
  const prompt = `Produce a dataset-to-deployment lineage for a model.
Input:
- Model: ${model_id || 'unspecified'}

Return JSON:
{
  "model": string,
  "datasets": [{ "dataset_id": string, "name": string, "sensitivity": string, "license": string, "role": "pretrain"|"finetune"|"eval"|"rag_index" }],
  "training_runs": [{ "run_id": string, "hours": number, "gpu_count": number, "cost_usd": number }],
  "deployments": [{ "deployment_id": string, "env": string, "region": string, "version": string }],
  "lineage_graph_edges": [{ "from": string, "to": string, "relation": string }],
  "compliance_evidence": [{ "artifact": string, "where_stored": string }],
  "gaps_detected": [string],
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt), { model: model_id });
}

// ---------- 11. Model card generator ----------
async function modelCardGenerator({ model_id }) {
  const prompt = `Draft a model card following the Mitchell et al. template.
Input:
- Model: ${model_id || 'unspecified'}

Return JSON:
{
  "model_details": { "name": string, "version": string, "owners": [string], "license": string, "provider": string },
  "intended_use": { "primary_users": [string], "primary_uses": [string], "out_of_scope_uses": [string] },
  "factors": [{ "factor": string, "relevance": string }],
  "metrics": [{ "metric": string, "value": string, "dataset": string }],
  "evaluation_data": [{ "dataset": string, "motivation": string }],
  "training_data": [{ "dataset": string, "notes": string }],
  "ethical_considerations": [string],
  "limitations": [string],
  "caveats_and_recommendations": [string],
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt, { maxTokens: 2200 }), { model_details: { name: model_id } });
}

// ---------- 12. Third-party assessment ----------
async function thirdPartyAssess({ party_id }) {
  const prompt = `Assess a third-party AI vendor / processor and recommend controls.
Input:
- Party: ${party_id || 'unspecified'}

Return JSON:
{
  "party": string,
  "inherent_risk": "low"|"medium"|"high"|"critical",
  "data_flows": [{ "flow": string, "data_categories": [string], "lawful_basis": string }],
  "dpia_required": boolean,
  "contractual_controls": [{ "clause": string, "rationale": string, "required": boolean }],
  "technical_controls": [{ "control": string, "framework_ref": string, "priority": "high"|"medium"|"low" }],
  "monitoring_requirements": [string],
  "exit_strategy": string,
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt), { party: party_id, inherent_risk: 'medium' });
}

// ---------- 13. Jailbreak test ----------
async function jailbreakTest({ model }) {
  const prompt = `Score a model's resistance to jailbreak attacks and propose sample attacks.
Input:
- Model: ${model || 'unspecified'}

Return JSON:
{
  "resistance_score": number,
  "rating": "fragile"|"weak"|"moderate"|"strong",
  "sample_attacks": [{ "name": string, "technique": string, "payload_sketch": string, "expected_outcome": string, "severity_if_succeeds": "low"|"medium"|"high"|"critical" }],
  "categories_covered": [string],
  "mitigations": [{ "control": string, "priority": "high"|"medium"|"low" }],
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt), { rating: 'moderate' });
}

// ---------- 14. Energy / carbon / cost forecast ----------
async function energyCost({ model, est_qps }) {
  const prompt = `Forecast energy, carbon, and dollar cost of running a model in production.
Input:
- Model: ${model || 'unspecified'}
- Estimated QPS: ${est_qps ?? 'unknown'}

Return JSON:
{
  "assumptions": { "hardware": string, "energy_per_inference_wh": number, "pue": number, "grid_carbon_intensity_g_per_kwh": number, "price_per_kwh_usd": number },
  "daily": { "inferences": number, "energy_kwh": number, "carbon_kg_co2e": number, "cost_usd": number },
  "annual": { "inferences": number, "energy_kwh": number, "carbon_kg_co2e": number, "cost_usd": number },
  "optimizations": [{ "action": string, "expected_reduction_pct": number, "priority": "high"|"medium"|"low" }],
  "sustainability_notes": [string],
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt), { assumptions: {} });
}

// ---------- 15. Control mapper ----------
async function controlMapper({ control_id, system }) {
  const prompt = `Map a single control to concrete technical implementations + required evidence.
Input:
- Control: ${control_id || 'unspecified'}
- System: ${system || 'unspecified'}

Return JSON:
{
  "control": string,
  "framework": string,
  "intent": string,
  "technical_mappings": [{ "layer": "infrastructure"|"data"|"model"|"application"|"process", "implementation": string, "tool_or_owner": string }],
  "evidence_artifacts": [{ "artifact": string, "where_stored": string, "review_cadence": string }],
  "test_procedure": string,
  "automation_opportunities": [string],
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt), { control: control_id });
}

// ---------- 16. SSP drafter ----------
async function sspDrafter({ system_name, framework }) {
  const prompt = `Draft a System Security Plan (SSP) outline.
Input:
- System: ${system_name || 'unspecified'}
- Framework: ${framework || 'NIST_RMF'}

Return JSON:
{
  "system_name": string,
  "framework": string,
  "system_description": string,
  "system_categorization": { "impact_level": string, "rationale": string },
  "authorization_boundary": string,
  "control_families": [{ "family": string, "controls": [{ "id": string, "title": string, "implementation": string, "responsible_role": string }] }],
  "interconnections": [{ "system": string, "type": string, "data_exchanged": string }],
  "risk_assessment_summary": string,
  "approval_chain": [{ "role": string, "responsibility": string }],
  "summary": string
}`;
  return safeJsonParse(await callOpenRouter(prompt, { maxTokens: 2400 }), { system_name, framework });
}

module.exports = {
  callOpenRouter,
  safeJsonParse,
  auditBias,
  detectDrift,
  mapCompliance,
  scoreRisk,
  draftPolicy,
  triageIncident,
  explainDecision,
  promptInjectionTest,
  fairnessCurve,
  dataLineage,
  modelCardGenerator,
  thirdPartyAssess,
  jailbreakTest,
  energyCost,
  controlMapper,
  sspDrafter,
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../services/api';

const features = [
  // Original CRUD
  { path: '/models',           title: 'Model Registry',     desc: 'Inventory of every deployed model with risk tier, owner, and version.', color: '#3b82f6', statKey: 'models', tag: 'CRUD' },
  { path: '/datasets',         title: 'Dataset Registry',   desc: 'Training and evaluation datasets with sensitivity, license, and PII flag.', color: '#8b5cf6', statKey: 'datasets', tag: 'CRUD' },
  { path: '/evaluations',      title: 'Evaluations',        desc: 'Benchmark and fairness evaluation results per model and dataset.', color: '#06b6d4', statKey: 'evaluations', tag: 'CRUD' },
  { path: '/deployments',      title: 'Deployments',        desc: 'Active production, staging, and pilot deployments by region and owner.', color: '#10b981', statKey: 'deployments', tag: 'CRUD' },
  { path: '/audit-logs',       title: 'Audit Logs',         desc: 'Immutable trail of governance and operational actions.', color: '#f59e0b', statKey: 'audit_logs', tag: 'CRUD' },
  { path: '/policies',         title: 'Policies',           desc: 'EU AI Act, NIST AI RMF, and ISO/IEC 42001 policy catalog.', color: '#ec4899', statKey: 'policies', tag: 'CRUD' },
  { path: '/incidents',        title: 'Incidents',          desc: 'Bias, drift, hallucination, and security incidents with status.', color: '#ef4444', statKey: 'incidents', tag: 'CRUD' },
  { path: '/risk-register',    title: 'Risk Register',      desc: 'Enterprise AI risks with likelihood, impact, and mitigations.', color: '#a855f7', statKey: 'risk_register', tag: 'CRUD' },
  // New CRUD
  { path: '/model-cards',      title: 'Model Cards',        desc: 'Mitchell-style cards: intended use, limitations, ethics.', color: '#22c55e', statKey: 'model_cards', tag: 'CRUD' },
  { path: '/prompts',          title: 'Prompts',            desc: 'Versioned prompt library with owners and templates.', color: '#0ea5e9', statKey: 'prompts', tag: 'CRUD' },
  { path: '/ssp',              title: 'SSPs',               desc: 'System Security Plans aligned to NIST AI RMF / ISO 42001.', color: '#fbbf24', statKey: 'ssp', tag: 'CRUD' },
  { path: '/dpia-records',     title: 'DPIA Records',       desc: 'Data Protection Impact Assessments and residual risk.', color: '#f97316', statKey: 'dpia', tag: 'CRUD' },
  { path: '/redteam-findings', title: 'Red-team Findings',  desc: 'Adversarial findings: technique, severity, mitigation.', color: '#dc2626', statKey: 'redteam', tag: 'CRUD' },
  { path: '/third-parties',    title: 'Third Parties',      desc: 'Processors, sub-processors, integrators and DPIA flags.', color: '#7c3aed', statKey: 'third_parties', tag: 'CRUD' },
  { path: '/training-runs',    title: 'Training Runs',      desc: 'GPU-hours, cost, and outcome per training run.', color: '#14b8a6', statKey: 'training_runs', tag: 'CRUD' },
  { path: '/fine-tunes',       title: 'Fine Tunes',         desc: 'Fine-tuned artefacts with eval and promotion status.', color: '#84cc16', statKey: 'fine_tunes', tag: 'CRUD' },
  { path: '/controls',         title: 'Controls',           desc: 'Framework controls across EU AI Act / NIST / ISO 42001.', color: '#6366f1', statKey: 'controls', tag: 'CRUD' },
  { path: '/jurisdictions',    title: 'Jurisdictions',      desc: 'Country / regulation applicability across the estate.', color: '#06b6d4', statKey: 'jurisdictions', tag: 'CRUD' },
  // Original AI
  { path: '/ai/audit-bias',            title: 'AI · Bias Audit',         desc: 'Audit a model against fairness metrics.', color: '#22d3ee', tag: 'AI' },
  { path: '/ai/detect-drift',          title: 'AI · Drift Detection',    desc: 'Diagnose drift signal + recommend actions.', color: '#34d399', tag: 'AI' },
  { path: '/ai/map-compliance',        title: 'AI · Compliance Map',     desc: 'Map a system to applicable controls and gaps.', color: '#facc15', tag: 'AI' },
  { path: '/ai/score-risk',            title: 'AI · Risk Scoring',       desc: 'Score a use-case against EU AI Act tiers.', color: '#f472b6', tag: 'AI' },
  { path: '/ai/draft-policy',          title: 'AI · Policy Drafting',    desc: 'Draft an internal AI policy aligned to a framework.', color: '#60a5fa', tag: 'AI' },
  { path: '/ai/triage-incident',       title: 'AI · Incident Triage',    desc: 'Triage severity, notification needs, containment.', color: '#fb7185', tag: 'AI' },
  // New AI
  { path: '/ai/explain-decision',      title: 'AI · Explain Decision',   desc: 'SHAP/LIME-style local explanation for a single decision.', color: '#a78bfa', tag: 'AI' },
  { path: '/ai/prompt-injection-test', title: 'AI · Prompt Injection',   desc: 'Assess injection-success likelihood + attack vectors.', color: '#f87171', tag: 'AI' },
  { path: '/ai/fairness-curve',        title: 'AI · Fairness Curve',     desc: 'Equal-opportunity curve and threshold recommendations.', color: '#5eead4', tag: 'AI' },
  { path: '/ai/data-lineage',          title: 'AI · Data Lineage',       desc: 'Dataset → training → deployment lineage.', color: '#fdba74', tag: 'AI' },
  { path: '/ai/model-card-generator',  title: 'AI · Model Card Gen',     desc: 'Auto-draft a Mitchell-style model card.', color: '#86efac', tag: 'AI' },
  { path: '/ai/third-party-assess',    title: 'AI · 3rd-Party Assess',   desc: 'Vendor risk + recommended controls.', color: '#c4b5fd', tag: 'AI' },
  { path: '/ai/jailbreak-test',        title: 'AI · Jailbreak Test',     desc: 'Resistance score + sample jailbreaks.', color: '#fca5a5', tag: 'AI' },
  { path: '/ai/energy-cost',           title: 'AI · Energy & Cost',      desc: 'Energy / carbon / dollar cost forecast.', color: '#a3e635', tag: 'AI' },
  { path: '/ai/control-mapper',        title: 'AI · Control Mapper',     desc: 'Control → tech implementation + evidence.', color: '#7dd3fc', tag: 'AI' },
  { path: '/ai/ssp-drafter',           title: 'AI · SSP Drafter',        desc: 'Draft a System Security Plan outline.', color: '#fde047', tag: 'AI' },
  // Platform
  { path: '/webhooks',         title: 'Webhooks',           desc: 'HMAC-signed event delivery + delivery log.', color: '#64748b', tag: 'PLATFORM' },
];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => { getDashboard().then(setStats).catch(console.error); }, []);

  const headlineCards = [
    { label: 'Models', value: stats?.models?.total ?? '—', sub: `${stats?.models?.high_risk ?? 0} high-risk` },
    { label: 'Datasets', value: stats?.datasets?.total ?? '—', sub: `${stats?.datasets?.pii_present ?? 0} with PII` },
    { label: 'Evaluations', value: stats?.evaluations?.total ?? '—', sub: `${stats?.evaluations?.failed ?? 0} failing` },
    { label: 'Deployments', value: stats?.deployments?.total ?? '—', sub: `${stats?.deployments?.production ?? 0} in production` },
    { label: 'Open Incidents', value: stats?.incidents?.open ?? '—', sub: `${stats?.incidents?.high_severity ?? 0} high severity` },
    { label: 'Published Policies', value: stats?.policies?.published ?? '—', sub: `${stats?.policies?.draft ?? 0} draft` },
    { label: 'Risks Tracked', value: stats?.risk_register?.total ?? '—', sub: `${stats?.risk_register?.high_impact ?? 0} high impact` },
    { label: 'Audit Log Entries', value: stats?.audit_logs?.total ?? '—', sub: 'immutable' },
    { label: 'Model Cards', value: stats?.model_cards?.total ?? '—', sub: '' },
    { label: 'SSPs', value: stats?.ssp?.total ?? '—', sub: `${stats?.ssp?.approved ?? 0} approved` },
    { label: 'Controls', value: stats?.controls?.total ?? '—', sub: `${stats?.controls?.missing ?? 0} missing` },
    { label: 'Red-team Findings', value: stats?.redteam?.total ?? '—', sub: `${stats?.redteam?.open ?? 0} open` },
    { label: 'Third Parties', value: stats?.third_parties?.total ?? '—', sub: `${stats?.third_parties?.dpia_required ?? 0} DPIA req.` },
    { label: 'Jurisdictions', value: stats?.jurisdictions?.total ?? '—', sub: `${stats?.jurisdictions?.gaps ?? 0} gaps` },
  ];

  return (
    <div>
      <div className="dashboard-header">
        <h1>AI Governance Dashboard</h1>
        <p>EU AI Act · NIST AI RMF · ISO/IEC 42001 — one operational view of your AI estate.</p>
      </div>

      <div className="stats-grid">
        {headlineCards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-card-label">{c.label}</div>
            <div className="stat-card-value">{c.value}</div>
            <div className="stat-card-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="feature-grid">
        {features.map((f) => (
          <div
            key={f.path}
            className="feature-card"
            style={{ '--card-color': f.color }}
            onClick={() => navigate(f.path)}
          >
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <span className="feature-card-tag">{f.tag}{f.statKey && stats?.[f.statKey]?.total != null ? ` · ${stats[f.statKey].total}` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;

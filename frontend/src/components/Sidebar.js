import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const registryLinks = [
  { path: '/models',         label: 'Model Registry' },
  { path: '/datasets',       label: 'Dataset Registry' },
  { path: '/evaluations',    label: 'Evaluations' },
  { path: '/deployments',    label: 'Deployments' },
  { path: '/model-cards',    label: 'Model Cards' },
  { path: '/prompts',        label: 'Prompts' },
  { path: '/training-runs',  label: 'Training Runs' },
  { path: '/fine-tunes',     label: 'Fine Tunes' },
];

const governanceLinks = [
  { path: '/policies',          label: 'Policies' },
  { path: '/controls',          label: 'Controls' },
  { path: '/ssp',               label: 'SSPs' },
  { path: '/dpia-records',      label: 'DPIA Records' },
  { path: '/jurisdictions',     label: 'Jurisdictions' },
  { path: '/audit-logs',        label: 'Audit Logs' },
  { path: '/incidents',         label: 'Incidents' },
  { path: '/risk-register',     label: 'Risk Register' },
  { path: '/redteam-findings',  label: 'Red-team Findings' },
  { path: '/third-parties',     label: 'Third Parties' },
  // Apply pass 7
  { path: '/approvals',         label: 'Approvals' },
  { path: '/disclosure-pack',   label: 'Disclosure Pack' },
];

const aiLinks = [
  { path: '/ai/audit-bias',            label: 'AI · Bias Audit' },
  { path: '/ai/detect-drift',          label: 'AI · Drift Detection' },
  { path: '/ai/map-compliance',        label: 'AI · Compliance Map' },
  { path: '/ai/score-risk',            label: 'AI · Risk Scoring' },
  { path: '/ai/draft-policy',          label: 'AI · Policy Drafting' },
  { path: '/ai/triage-incident',       label: 'AI · Incident Triage' },
  { path: '/ai/explain-decision',      label: 'AI · Explain Decision' },
  { path: '/ai/prompt-injection-test', label: 'AI · Prompt Injection' },
  { path: '/ai/fairness-curve',        label: 'AI · Fairness Curve' },
  { path: '/ai/data-lineage',          label: 'AI · Data Lineage' },
  { path: '/ai/model-card-generator',  label: 'AI · Model Card Gen' },
  { path: '/ai/third-party-assess',    label: 'AI · 3rd-Party Assess' },
  { path: '/ai/jailbreak-test',        label: 'AI · Jailbreak Test' },
  { path: '/ai/energy-cost',           label: 'AI · Energy & Cost' },
  { path: '/ai/control-mapper',        label: 'AI · Control Mapper' },
  { path: '/ai/ssp-drafter',           label: 'AI · SSP Drafter' },
  // Apply pass 7
  { path: '/ai/redteam-triage',        label: 'AI · Red-team Triage' },
  { path: '/ai/drift-narrative',       label: 'AI · Drift Narrative' },
  { path: '/ai/bias-summary',          label: 'AI · Bias Summary' },
];

const platformLinks = [
  { path: '/webhooks', label: 'Webhooks' },
];

const mlGovLinks = [
  { path: '/custom-views', label: 'MLGov Views' },
];

function Sidebar({ onLogout }) {
  const location = useLocation();
  const isActive = (p) => location.pathname === p || (p !== '/' && location.pathname.startsWith(p));

  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch (_) {}

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">AI Governance · ModelOps</div>
      <div className="sidebar-sub">EU AI Act · NIST AI RMF · ISO 42001</div>

      <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>

      <div className="sidebar-section">Model & Data Registry</div>
      {registryLinks.map((l) => (
        <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`}>{l.label}</Link>
      ))}

      <div className="sidebar-section">Governance & Compliance</div>
      {governanceLinks.map((l) => (
        <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`}>{l.label}</Link>
      ))}

      <div className="sidebar-section">AI Assistants</div>
      {aiLinks.map((l) => (
        <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`}>{l.label}</Link>
      ))}

      <div className="sidebar-section">Platform</div>
      {platformLinks.map((l) => (
        <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`}>{l.label}</Link>
      ))}

      <div className="sidebar-section">MLGov Views</div>
      {mlGovLinks.map((l) => (
        <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`}>{l.label}</Link>
      ))}

      <div className="sidebar-footer">
        <NotificationBell />
        {user && <div className="sidebar-user">{user.name || user.email}{user.role ? ` · ${user.role}` : ''}</div>}
        {onLogout && (
          <button className="btn btn-ghost" onClick={onLogout} style={{ width: '100%', marginTop: 6 }}>
            Log out
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;

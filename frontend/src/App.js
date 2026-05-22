import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
// Original CRUD
import ModelsPage from './pages/ModelsPage';
import DatasetsPage from './pages/DatasetsPage';
import EvaluationsPage from './pages/EvaluationsPage';
import DeploymentsPage from './pages/DeploymentsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import PoliciesPage from './pages/PoliciesPage';
import IncidentsPage from './pages/IncidentsPage';
import RiskRegisterPage from './pages/RiskRegisterPage';
// New CRUD
import ModelCardsPage from './pages/ModelCardsPage';
import PromptsPage from './pages/PromptsPage';
import SspPage from './pages/SspPage';
import DpiaRecordsPage from './pages/DpiaRecordsPage';
import RedteamFindingsPage from './pages/RedteamFindingsPage';
import ThirdPartiesPage from './pages/ThirdPartiesPage';
import TrainingRunsPage from './pages/TrainingRunsPage';
import FineTunesPage from './pages/FineTunesPage';
import ControlsPage from './pages/ControlsPage';
import JurisdictionsPage from './pages/JurisdictionsPage';
// Original AI
import AIAuditBiasPage from './pages/AIAuditBiasPage';
import AIDetectDriftPage from './pages/AIDetectDriftPage';
import AIMapCompliancePage from './pages/AIMapCompliancePage';
import AIScoreRiskPage from './pages/AIScoreRiskPage';
import AIDraftPolicyPage from './pages/AIDraftPolicyPage';
import AITriageIncidentPage from './pages/AITriageIncidentPage';
// New AI
import AIExplainDecisionPage from './pages/AIExplainDecisionPage';
import AIPromptInjectionTestPage from './pages/AIPromptInjectionTestPage';
import AIFairnessCurvePage from './pages/AIFairnessCurvePage';
import AIDataLineagePage from './pages/AIDataLineagePage';
import AIModelCardGeneratorPage from './pages/AIModelCardGeneratorPage';
import AIThirdPartyAssessPage from './pages/AIThirdPartyAssessPage';
import AIJailbreakTestPage from './pages/AIJailbreakTestPage';
import AIEnergyCostPage from './pages/AIEnergyCostPage';
import AIControlMapperPage from './pages/AIControlMapperPage';
import AISspDrafterPage from './pages/AISspDrafterPage';
// Apply pass 7 — backlog implementation
import AIRedteamTriagePage from './pages/AIRedteamTriagePage';
import AIDriftNarrativePage from './pages/AIDriftNarrativePage';
import AIBiasSummaryPage from './pages/AIBiasSummaryPage';
import DisclosurePackPage from './pages/DisclosurePackPage';
import ApprovalsPage from './pages/ApprovalsPage';
// Platform
import WebhooksPage from './pages/WebhooksPage';
// Custom Views (MLGov)
import CustomViewsPage from './pages/CustomViewsPage';
// Login
import LoginPage from './pages/LoginPage';
import { getToken, logout } from './services/api';
import './App.css';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';
import ModelExceptionWaiverBoard from './pages/ModelExceptionWaiverBoard';

function Shell({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Toggle navigation"
      >
        {sidebarOpen ? '×' : '☰'}
      </button>
      <Sidebar onLogout={onLogout} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <main className="main">
        <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

          <Route path="/" element={<Dashboard />} />
          {/* Original CRUD */}
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/datasets" element={<DatasetsPage />} />
          <Route path="/evaluations" element={<EvaluationsPage />} />
          <Route path="/deployments" element={<DeploymentsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/risk-register" element={<RiskRegisterPage />} />
          {/* New CRUD */}
          <Route path="/model-cards" element={<ModelCardsPage />} />
          <Route path="/prompts" element={<PromptsPage />} />
          <Route path="/ssp" element={<SspPage />} />
          <Route path="/dpia-records" element={<DpiaRecordsPage />} />
          <Route path="/redteam-findings" element={<RedteamFindingsPage />} />
          <Route path="/third-parties" element={<ThirdPartiesPage />} />
          <Route path="/training-runs" element={<TrainingRunsPage />} />
          <Route path="/fine-tunes" element={<FineTunesPage />} />
          <Route path="/controls" element={<ControlsPage />} />
          <Route path="/jurisdictions" element={<JurisdictionsPage />} />
          {/* Original AI */}
          <Route path="/ai/audit-bias" element={<AIAuditBiasPage />} />
          <Route path="/ai/detect-drift" element={<AIDetectDriftPage />} />
          <Route path="/ai/map-compliance" element={<AIMapCompliancePage />} />
          <Route path="/ai/score-risk" element={<AIScoreRiskPage />} />
          <Route path="/ai/draft-policy" element={<AIDraftPolicyPage />} />
          <Route path="/ai/triage-incident" element={<AITriageIncidentPage />} />
          {/* New AI */}
          <Route path="/ai/explain-decision" element={<AIExplainDecisionPage />} />
          <Route path="/ai/prompt-injection-test" element={<AIPromptInjectionTestPage />} />
          <Route path="/ai/fairness-curve" element={<AIFairnessCurvePage />} />
          <Route path="/ai/data-lineage" element={<AIDataLineagePage />} />
          <Route path="/ai/model-card-generator" element={<AIModelCardGeneratorPage />} />
          <Route path="/ai/third-party-assess" element={<AIThirdPartyAssessPage />} />
          <Route path="/ai/jailbreak-test" element={<AIJailbreakTestPage />} />
          <Route path="/ai/energy-cost" element={<AIEnergyCostPage />} />
          <Route path="/ai/control-mapper" element={<AIControlMapperPage />} />
          <Route path="/ai/ssp-drafter" element={<AISspDrafterPage />} />
          {/* Apply pass 7 — new AI verbs + disclosure pack + approvals */}
          <Route path="/ai/redteam-triage" element={<AIRedteamTriagePage />} />
          <Route path="/ai/drift-narrative" element={<AIDriftNarrativePage />} />
          <Route path="/ai/bias-summary" element={<AIBiasSummaryPage />} />
          <Route path="/disclosure-pack" element={<DisclosurePackPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          {/* Platform */}
          <Route path="/webhooks" element={<WebhooksPage />} />
          {/* MLGov custom views */}
          <Route path="/custom-views" element={<CustomViewsPage />} />
          <Route path="/model-exception-waiver-board" element={<ModelExceptionWaiverBoard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function LoginGate({ onLogin }) {
  const navigate = useNavigate();
  return <LoginPage onLogin={() => { onLogin(); navigate('/'); }} />;
}

function App() {
  const [authed, setAuthed] = useState(!!getToken());
  function handleLogin() { setAuthed(true); }
  function handleLogout() { logout(); setAuthed(false); }

  return (
    <BrowserRouter>
      {!authed ? (
        <Routes>
          <Route path="/login" element={<LoginGate onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/*" element={<Shell onLogout={handleLogout} />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;

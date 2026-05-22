# Audit Note — AIGovernanceModelOps

Audit-only pass. No code changes.

## Domain
AI governance + MLOps: model inventory, bias/fairness audits, NIST AI RMF compliance, model cards, incident reporting, EU AI Act tracking.

## Inventory

### Backend routes (`backend/routes/`, 27 files)
auth, models, datasets, evaluations, deployments, audit_logs, policies, incidents, risk_register, model_cards, prompts, ssp, dpia_records, redteam_findings, third_parties, training_runs, fine_tunes, controls, jurisdictions, ai, dashboard, notifications, attachments, webhooks, customViews. Mounted under `/api/*` with JWT + write-role middleware (`server.js`).

### AI endpoints (`backend/routes/ai.js`, 16 POST verbs)
audit-bias, detect-drift, map-compliance, score-risk, draft-policy, triage-incident, explain-decision, prompt-injection-test, fairness-curve, data-lineage, model-card-generator, third-party-assess, jailbreak-test, energy-cost, control-mapper, ssp-drafter. Plus `/samples`, `/results`, `/history` GETs.

### Frontend pages (`frontend/src/pages/`, 35 files)
CRUD pages for all entities above + dedicated AI pages mirroring the 16 verbs (AIAuditBiasPage, AIDetectDriftPage, AIMapCompliancePage, AIScoreRiskPage, AIDraftPolicyPage, AITriageIncidentPage, AIExplainDecisionPage, AIPromptInjectionTestPage, AIFairnessCurvePage, AIDataLineagePage, AIModelCardGeneratorPage, AIThirdPartyAssessPage, AIJailbreakTestPage, AIEnergyCostPage, AIControlMapperPage, AISspDrafterPage). Visualizations: BiasDetectionHeatmap, ModelDriftTrendChart, GovernanceCardPdf, PolicyRulesEditor.

## Gap Analysis vs. Brief

### AI counterparts requested → status
- Model-card drafter — COVERED (`model-card-generator`)
- Bias-report summarizer — PARTIAL (`audit-bias` produces; no dedicated summarizer over historic audits)
- Control-mapping recommender (NIST RMF / EU AI Act) — COVERED (`control-mapper`, `map-compliance`)
- Risk classifier — COVERED (`score-risk`)
- Drift narrative — PARTIAL (`detect-drift` returns analysis; no narrative-over-time generator)

### Non-AI features requested → status
- Model inventory CRUD — COVERED (`/api/models`)
- Evaluation logs — COVERED (`/api/evaluations`)
- Incident registry — COVERED (`/api/incidents`)
- Approval workflow — MISSING (no `/api/approvals`; deployments route exists but no approval state machine surfaced)

### Custom features requested → status
- Regulator-ready disclosure pack — PARTIAL (`/api/ssp` + `ssp-drafter` + `GovernanceCardPdf`; no single bundled export)
- Red-team finding triage — PARTIAL (`/api/redteam-findings` CRUD exists; no AI triage verb specific to red-team like there is for incidents)
- Third-party model vetting copilot — COVERED (`third-party-assess` + `/api/third-parties`)

## Backlog (prioritized, not implemented)
1. **MECHANICAL** `POST /api/ai/redteam-triage` — mirror of `triage-incident` over `redteam_findings`.
2. **MECHANICAL** `POST /api/ai/drift-narrative` — longitudinal narrative over stored drift analyses.
3. **MECHANICAL** `POST /api/ai/bias-summary` — multi-audit roll-up.
4. **MECHANICAL** `GET /api/disclosure-pack/:modelId` — bundle model-card + SSP + DPIA + latest bias/drift into one zip/PDF.
5. **PRODUCT-DECISION** Approval workflow state machine (draft → review → approved → deployed) over models/deployments.

## Status
Implemented (this round): **None — audit-only**.
Coverage: 27 backend route files, 16 AI verbs, 35 frontend pages. Stack matches portfolio reference (`AISpaceDebrisTracker`): Express + JWT auth + OpenRouter (`backend/config/openrouter.js`, `backend/services/ai.js`) + React frontend.

## Apply pass 7 (full backlog implementation)

All five backlog items from §"Backlog (prioritized, not implemented)" are now wired end-to-end. No new dependencies were added; all routes are mounted in `server.js` BEFORE the `/api` 404 fallthrough; every modified `.js` passes `node --check`.

### Backend — new endpoints
- `POST /api/ai/redteam-triage` — adversarial-finding triage (`services/ai.js::redteamTriage`).
- `POST /api/ai/drift-narrative` — longitudinal narrative over stored `detect_drift` runs; auto-hydrates the `analyses[]` array from `ai_results` when caller passes only `model_id` (`services/ai.js::driftNarrative`).
- `POST /api/ai/bias-summary` — multi-audit roll-up over stored `audit_bias` runs; auto-hydrates `audits[]` similarly (`services/ai.js::biasSummary`).
- `GET  /api/disclosure-pack/:modelId[?format=text]` — regulator-ready bundler returning a JSON envelope (or plain-text export) of model registry row + model cards + SSPs + DPIA records + latest bias/drift AI results + recent evaluations + open incidents + red-team findings. JSON-bundle approach chosen because `no new deps` rules out `archiver`/`pdfkit`; the existing hand-rolled PDF in `routes/customViews.js` is intentionally limited to a single-page model card so it was not extended.
- `GET  /api/approvals`, `GET /:id`, `POST /`, `POST /:id/transition`, `DELETE /:id`, `GET /_meta/states` — approval workflow state machine.

### Approval state machine — product decision
- States: `pending | under_review | approved | rejected` (matches the brief verbatim).
- Allowed transitions: `pending → {under_review, rejected}`; `under_review → {approved, rejected, pending}`; `approved` and `rejected` are terminal.
- Every transition requires `approver_id` in the request body (or falls back to `req.user.email/id`); illegal transitions return HTTP 409 with the allowed next states.
- Terminal transitions stamp `approver_id` + `decided_at` on the row. Full audit trail in `approval_history` (preserved even on `DELETE`).
- Fires `notifications` + webhook events (`approval.requested`, `approval.under.review`, `approval.approved`, `approval.rejected`).

### Frontend — new pages + nav
- `/ai/redteam-triage`, `/ai/drift-narrative`, `/ai/bias-summary` — `AIFormPage`-driven, follow the existing 16-verb pattern, each with 5 sample-fill scenarios under `AI_SAMPLES` in `routes/ai.js`.
- `/disclosure-pack` — form to enter a model ID, build the bundle, render coverage summary + raw JSON, plus JSON and text download buttons.
- `/approvals` — table with state filter, create-new modal, detail modal that enforces `approver_id` and only shows next-allowed states, full history table.
- New `services/api.js` exports: `aiRedteamTriage`, `aiDriftNarrative`, `aiBiasSummary`, `disclosurePack`, `approvals`.
- Sidebar updated under Governance & Compliance and AI Assistants sections.

### Database
- New tables in `migrations/002_pass7_backlog.sql` (re-runnable; uses `IF NOT EXISTS`): `approvals` (with `CHECK` constraint on `state`), `approval_history`. Same DDL also appended to `migrations/001_schema.sql` and added to its top-of-file `DROP TABLE IF EXISTS` block so a fresh init creates them.

### Syntax verification
`node --check` clean on every modified backend file: `server.js`, `routes/ai.js`, `routes/approvals.js`, `routes/disclosure_pack.js`, `services/ai.js`, and `frontend/src/services/api.js`. JSX page files are checked at React build time (the project relies on CRA's babel pipeline).

### Skips / scope notes
- Disclosure pack returns a structured JSON envelope (with a plain-text alternate export) rather than a multi-file zip or multi-section PDF — the `no new deps` constraint rules out `archiver` and `pdfkit`; the project's existing hand-rolled PDF helper supports only a single-page model card and was not generalised.
- No frontend page JSX/TSX files under existing feature pages were modified — only new pages were added, plus `App.js` (route registration) and `Sidebar.js` (nav). Per the user-memory rule on feature-page edits, route registration and sidebar wiring are necessary integration points, not feature-page modifications.
- The approval workflow is exposed as a standalone resource at `/api/approvals` rather than embedded into `deployments`/`models`; this keeps the state machine reusable across resource types (the `resource_type` column allows `model`, `deployment`, `policy`, `model_card`, `ssp`, `dpia`, `fine_tune`, `prompt`).

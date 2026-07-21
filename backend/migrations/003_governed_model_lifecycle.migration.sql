ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_key VARCHAR(120) NOT NULL DEFAULT 'default';

CREATE TABLE IF NOT EXISTS governance_cases (
  id BIGSERIAL PRIMARY KEY,
  tenant_key VARCHAR(120) NOT NULL,
  client_case_id VARCHAR(160) NOT NULL,
  model_name VARCHAR(240) NOT NULL,
  model_version VARCHAR(120) NOT NULL,
  use_case TEXT NOT NULL,
  owner VARCHAR(200) NOT NULL,
  requester_id INTEGER NOT NULL REFERENCES users(id),
  ruleset_version VARCHAR(120) NOT NULL,
  risk_tier VARCHAR(30) NOT NULL,
  status VARCHAR(40) NOT NULL CHECK(status IN ('blocked','pending_review','approved','rejected','change_review','retired')),
  gate_result JSONB NOT NULL,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_key, client_case_id)
);

CREATE TABLE IF NOT EXISTS governance_evidence_snapshots (
  id BIGSERIAL PRIMARY KEY,
  case_id BIGINT NOT NULL REFERENCES governance_cases(id) ON DELETE RESTRICT,
  evidence_type VARCHAR(60) NOT NULL,
  source_uri TEXT NOT NULL,
  source_sha256 VARCHAR(64) NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL,
  fingerprint VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(case_id, fingerprint)
);

CREATE TABLE IF NOT EXISTS governance_evaluation_snapshots (
  id BIGSERIAL PRIMARY KEY,
  case_id BIGINT NOT NULL REFERENCES governance_cases(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  metric VARCHAR(120) NOT NULL,
  dataset_version VARCHAR(200) NOT NULL,
  code_sha256 VARCHAR(64) NOT NULL,
  score NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  passed BOOLEAN NOT NULL,
  random_seed VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS governance_case_changes (
  id BIGSERIAL PRIMARY KEY,
  case_id BIGINT NOT NULL REFERENCES governance_cases(id) ON DELETE RESTRICT,
  previous_version VARCHAR(120) NOT NULL,
  proposed_version VARCHAR(120) NOT NULL,
  change_summary TEXT NOT NULL,
  requested_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS governance_immutable_audit (
  id BIGSERIAL PRIMARY KEY,
  tenant_key VARCHAR(120) NOT NULL,
  case_id BIGINT REFERENCES governance_cases(id),
  actor_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_governance_cases_tenant_status ON governance_cases(tenant_key,status,created_at DESC);

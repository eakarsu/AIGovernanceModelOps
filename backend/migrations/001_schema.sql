-- AI Governance / Model Ops schema
DROP TABLE IF EXISTS webhook_deliveries CASCADE;
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS jurisdictions CASCADE;
DROP TABLE IF EXISTS controls CASCADE;
DROP TABLE IF EXISTS fine_tunes CASCADE;
DROP TABLE IF EXISTS training_runs CASCADE;
DROP TABLE IF EXISTS third_parties CASCADE;
DROP TABLE IF EXISTS redteam_findings CASCADE;
DROP TABLE IF EXISTS dpia_records CASCADE;
DROP TABLE IF EXISTS ssp CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS model_cards CASCADE;
DROP TABLE IF EXISTS risk_register CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS deployments CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS datasets CASCADE;
DROP TABLE IF EXISTS models CASCADE;
DROP TABLE IF EXISTS ai_results CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(160) UNIQUE NOT NULL,
  password VARCHAR(200) NOT NULL,
  name VARCHAR(120),
  role VARCHAR(40) DEFAULT 'compliance',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE models (
  id SERIAL PRIMARY KEY,
  model_id VARCHAR(120) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  provider VARCHAR(120),
  version VARCHAR(60),
  owner VARCHAR(120),
  deployed_at TIMESTAMP,
  risk_tier VARCHAR(40),
  status VARCHAR(40) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE datasets (
  id SERIAL PRIMARY KEY,
  dataset_id VARCHAR(120) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  source VARCHAR(200),
  sensitivity VARCHAR(40),
  size_rows BIGINT DEFAULT 0,
  license VARCHAR(80),
  registered_at TIMESTAMP DEFAULT NOW(),
  pii_present BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE evaluations (
  id SERIAL PRIMARY KEY,
  eval_id VARCHAR(120) UNIQUE NOT NULL,
  model VARCHAR(200),
  dataset VARCHAR(200),
  metric VARCHAR(80),
  score DECIMAL(10,4),
  run_at TIMESTAMP DEFAULT NOW(),
  passed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deployments (
  id SERIAL PRIMARY KEY,
  deployment_id VARCHAR(120) UNIQUE NOT NULL,
  model VARCHAR(200),
  env VARCHAR(40),
  region VARCHAR(60),
  version VARCHAR(60),
  deployed_at TIMESTAMP DEFAULT NOW(),
  owner VARCHAR(120),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  log_id VARCHAR(120) UNIQUE NOT NULL,
  actor VARCHAR(160),
  action VARCHAR(120),
  target VARCHAR(200),
  timestamp TIMESTAMP DEFAULT NOW(),
  model_version VARCHAR(60),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE policies (
  id SERIAL PRIMARY KEY,
  policy_id VARCHAR(120) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  framework VARCHAR(40),
  scope VARCHAR(200),
  status VARCHAR(40) DEFAULT 'draft',
  owner VARCHAR(120),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  incident_id VARCHAR(120) UNIQUE NOT NULL,
  model VARCHAR(200),
  type VARCHAR(40),
  severity VARCHAR(40),
  status VARCHAR(40) DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT NOW(),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE risk_register (
  id SERIAL PRIMARY KEY,
  risk_id VARCHAR(120) UNIQUE NOT NULL,
  category VARCHAR(120),
  description TEXT,
  likelihood VARCHAR(40),
  impact VARCHAR(40),
  mitigation TEXT,
  owner VARCHAR(120),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_results (
  id SERIAL PRIMARY KEY,
  feature VARCHAR(80) NOT NULL,
  input JSONB,
  output JSONB,
  model VARCHAR(120),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- New CRUD entities
-- ============================================================

CREATE TABLE model_cards (
  id SERIAL PRIMARY KEY,
  card_id VARCHAR(120) UNIQUE NOT NULL,
  model VARCHAR(200),
  version VARCHAR(60),
  owners VARCHAR(300),
  intended_use TEXT,
  limitations TEXT,
  ethical_considerations TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prompts (
  id SERIAL PRIMARY KEY,
  prompt_id VARCHAR(120) UNIQUE NOT NULL,
  name VARCHAR(200),
  system TEXT,
  user_template TEXT,
  version VARCHAR(60),
  owner VARCHAR(120),
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ssp (
  id SERIAL PRIMARY KEY,
  ssp_id VARCHAR(120) UNIQUE NOT NULL,
  system_name VARCHAR(200),
  framework VARCHAR(40),
  status VARCHAR(40) DEFAULT 'draft',
  owner VARCHAR(120),
  version VARCHAR(60),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dpia_records (
  id SERIAL PRIMARY KEY,
  dpia_id VARCHAR(120) UNIQUE NOT NULL,
  system VARCHAR(200),
  scope TEXT,
  data_categories VARCHAR(300),
  mitigations TEXT,
  residual_risk VARCHAR(40),
  approved_by VARCHAR(160),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE redteam_findings (
  id SERIAL PRIMARY KEY,
  finding_id VARCHAR(120) UNIQUE NOT NULL,
  model VARCHAR(200),
  technique VARCHAR(160),
  severity VARCHAR(40),
  status VARCHAR(40) DEFAULT 'open',
  found_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE third_parties (
  id SERIAL PRIMARY KEY,
  party_id VARCHAR(120) UNIQUE NOT NULL,
  name VARCHAR(200),
  role VARCHAR(40),
  dpia_required BOOLEAN DEFAULT false,
  contract_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE training_runs (
  id SERIAL PRIMARY KEY,
  run_id VARCHAR(120) UNIQUE NOT NULL,
  model VARCHAR(200),
  dataset VARCHAR(200),
  hours DECIMAL(10,2),
  gpu_count INT,
  cost_usd DECIMAL(12,2),
  status VARCHAR(40),
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fine_tunes (
  id SERIAL PRIMARY KEY,
  ft_id VARCHAR(120) UNIQUE NOT NULL,
  base_model VARCHAR(200),
  dataset VARCHAR(200),
  run_id VARCHAR(120),
  eval_score DECIMAL(10,4),
  status VARCHAR(40),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE controls (
  id SERIAL PRIMARY KEY,
  control_id VARCHAR(120) UNIQUE NOT NULL,
  framework VARCHAR(40),
  control_id_ext VARCHAR(120),
  title VARCHAR(300),
  owner VARCHAR(120),
  status VARCHAR(40),
  last_tested TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE jurisdictions (
  id SERIAL PRIMARY KEY,
  juris_id VARCHAR(120) UNIQUE NOT NULL,
  country VARCHAR(120),
  regulation VARCHAR(80),
  applicable_systems VARCHAR(400),
  status VARCHAR(40),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Cross-cutting: notifications, attachments, webhooks
-- ============================================================

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(160),
  kind VARCHAR(60),
  title VARCHAR(300),
  body TEXT,
  resource VARCHAR(120),
  resource_id VARCHAR(120),
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attachments (
  id SERIAL PRIMARY KEY,
  attachment_id VARCHAR(120) UNIQUE NOT NULL,
  resource VARCHAR(60),
  resource_id VARCHAR(120),
  filename VARCHAR(300),
  mime VARCHAR(120),
  size_bytes BIGINT DEFAULT 0,
  content BYTEA,
  uploaded_by VARCHAR(160),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE webhooks (
  id SERIAL PRIMARY KEY,
  webhook_id VARCHAR(120) UNIQUE NOT NULL,
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(200),
  events VARCHAR(400),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id VARCHAR(120),
  event VARCHAR(80),
  payload JSONB,
  status_code INT,
  response TEXT,
  signature VARCHAR(200),
  delivered_at TIMESTAMP DEFAULT NOW()
);

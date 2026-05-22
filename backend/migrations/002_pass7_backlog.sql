-- Apply pass 7 — full backlog implementation
-- Approval workflow state machine: pending | under_review | approved | rejected
-- Each transition stamps an approver_id; full audit trail in approval_history.

CREATE TABLE IF NOT EXISTS approvals (
  id SERIAL PRIMARY KEY,
  approval_id   VARCHAR(120) UNIQUE NOT NULL,
  resource_type VARCHAR(80)  NOT NULL,   -- e.g. 'model', 'deployment', 'policy'
  resource_id   VARCHAR(160) NOT NULL,   -- natural key of the target row
  state         VARCHAR(40)  NOT NULL DEFAULT 'pending',
  requested_by  VARCHAR(160) NOT NULL,
  approver_id   VARCHAR(160),            -- stamped on terminal transition
  notes         TEXT,
  decided_at    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  CONSTRAINT approvals_state_chk
    CHECK (state IN ('pending', 'under_review', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS approvals_resource_idx
  ON approvals (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS approvals_state_idx
  ON approvals (state);

CREATE TABLE IF NOT EXISTS approval_history (
  id SERIAL PRIMARY KEY,
  approval_id  VARCHAR(120) NOT NULL,
  from_state   VARCHAR(40),                 -- NULL on initial create
  to_state     VARCHAR(40) NOT NULL,
  actor_id     VARCHAR(160) NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS approval_history_approval_idx
  ON approval_history (approval_id);

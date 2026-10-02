-- The destructive legacy demo seed can recreate users after migration 003.
-- Restore the tenant claim and the governance references without changing data.
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_key VARCHAR(120) NOT NULL DEFAULT 'default';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'governance_cases'::regclass AND conname = 'governance_cases_requester_id_fkey') THEN
    ALTER TABLE governance_cases ADD CONSTRAINT governance_cases_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'governance_cases'::regclass AND conname = 'governance_cases_approved_by_fkey') THEN
    ALTER TABLE governance_cases ADD CONSTRAINT governance_cases_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'governance_case_changes'::regclass AND conname = 'governance_case_changes_requested_by_fkey') THEN
    ALTER TABLE governance_case_changes ADD CONSTRAINT governance_case_changes_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'governance_immutable_audit'::regclass AND conname = 'governance_immutable_audit_actor_id_fkey') THEN
    ALTER TABLE governance_immutable_audit ADD CONSTRAINT governance_immutable_audit_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES users(id);
  END IF;
END $$;

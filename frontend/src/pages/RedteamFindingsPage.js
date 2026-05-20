import React from 'react';
import CrudPage from '../components/CrudPage';
import { redteamFindings } from '../services/api';

const SEVERITY = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'mitigated', 'accepted'];

export default function RedteamFindingsPage() {
  return (
    <CrudPage
      title="Red-team Findings"
      description="Findings from adversarial red-team and jailbreak campaigns."
      api={redteamFindings}
      resourceKey="redteam_findings"
      columns={[
        { key: 'finding_id', label: 'Finding ID' },
        { key: 'model', label: 'Model' },
        { key: 'technique', label: 'Technique' },
        { key: 'severity', label: 'Severity', render: (v) => <span className={`badge ${v}`}>{v || '—'}</span> },
        { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v}`}>{v || '—'}</span> },
        { key: 'found_at', label: 'Found' },
      ]}
      formFields={[
        { key: 'finding_id', label: 'Finding ID', placeholder: 'RT-011' },
        { key: 'model', label: 'Model' },
        { key: 'technique', label: 'Technique' },
        { key: 'severity', label: 'Severity', type: 'select', options: SEVERITY },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES },
        { key: 'found_at', label: 'Found At (YYYY-MM-DD)' },
      ]}
      defaults={{ severity: 'medium', status: 'open' }}
    />
  );
}

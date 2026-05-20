import React from 'react';
import CrudPage from '../components/CrudPage';
import { jurisdictions } from '../services/api';

const REGS = ['EU_AI_Act', 'UK_AISA', 'US_EO_14110', 'AIDA', 'PL-2338', 'GenAI Measures', 'METI AI Guidelines', 'AI Verify', 'eSafety Framework', 'DPDP Act'];
const STATUSES = ['compliant', 'gap', 'under_review'];

export default function JurisdictionsPage() {
  return (
    <CrudPage
      title="Jurisdictions"
      description="Country / regulation applicability tracker for the AI estate."
      api={jurisdictions}
      resourceKey="jurisdictions"
      columns={[
        { key: 'juris_id', label: 'Jurisdiction ID' },
        { key: 'country', label: 'Country' },
        { key: 'regulation', label: 'Regulation' },
        { key: 'applicable_systems', label: 'Applicable Systems' },
        { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v}`}>{v || '—'}</span> },
      ]}
      formFields={[
        { key: 'juris_id', label: 'Jurisdiction ID', placeholder: 'JR-011' },
        { key: 'country', label: 'Country' },
        { key: 'regulation', label: 'Regulation', type: 'select', options: REGS },
        { key: 'applicable_systems', label: 'Applicable Systems' },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES },
      ]}
      defaults={{ status: 'under_review' }}
    />
  );
}

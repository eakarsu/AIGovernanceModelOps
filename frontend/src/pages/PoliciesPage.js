import React from 'react';
import CrudPage from '../components/CrudPage';
import { policies } from '../services/api';

const FRAMEWORKS = ['EU_AI_Act', 'NIST_RMF', 'ISO_42001'];
const STATUSES = ['draft', 'review', 'published'];

export default function PoliciesPage() {
  return (
    <CrudPage
      title="Policies"
      description="Governance policies aligned to EU AI Act, NIST AI RMF, and ISO/IEC 42001."
      api={policies}
      columns={[
        { key: 'policy_id', label: 'Policy ID' },
        { key: 'name', label: 'Name' },
        { key: 'framework', label: 'Framework' },
        { key: 'scope', label: 'Scope' },
        { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v}`}>{v}</span> },
        { key: 'owner', label: 'Owner' },
      ]}
      formFields={[
        { key: 'policy_id', label: 'Policy ID' },
        { key: 'name', label: 'Name' },
        { key: 'framework', label: 'Framework', type: 'select', options: FRAMEWORKS },
        { key: 'scope', label: 'Scope', full: true },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES },
        { key: 'owner', label: 'Owner' },
      ]}
      defaults={{ framework: 'EU_AI_Act', status: 'draft' }}
    />
  );
}

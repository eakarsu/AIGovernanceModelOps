import React from 'react';
import CrudPage from '../components/CrudPage';
import { models } from '../services/api';

const RISK_TIERS = ['minimal', 'limited', 'high', 'unacceptable'];
const STATUSES   = ['active', 'pilot', 'deprecated', 'restricted'];

export default function ModelsPage() {
  return (
    <CrudPage
      title="Models"
      description="Registry of every AI model in scope, with EU AI Act risk tier and ownership."
      api={models}
      columns={[
        { key: 'model_id', label: 'Model ID' },
        { key: 'name', label: 'Name' },
        { key: 'provider', label: 'Provider' },
        { key: 'version', label: 'Version' },
        { key: 'risk_tier', label: 'Risk Tier', render: (v) => <span className={`badge ${v}`}>{v || '—'}</span> },
        { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v}`}>{v || '—'}</span> },
        { key: 'owner', label: 'Owner' },
      ]}
      formFields={[
        { key: 'model_id', label: 'Model ID', placeholder: 'MDL-016' },
        { key: 'name', label: 'Name' },
        { key: 'provider', label: 'Provider' },
        { key: 'version', label: 'Version' },
        { key: 'owner', label: 'Owner (email)' },
        { key: 'deployed_at', label: 'Deployed At (YYYY-MM-DD)' },
        { key: 'risk_tier', label: 'Risk Tier', type: 'select', options: RISK_TIERS },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES },
      ]}
      defaults={{ risk_tier: 'limited', status: 'active' }}
    />
  );
}

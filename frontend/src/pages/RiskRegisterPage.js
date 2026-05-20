import React from 'react';
import CrudPage from '../components/CrudPage';
import { riskRegister } from '../services/api';

const LEVELS = ['low', 'medium', 'high'];

export default function RiskRegisterPage() {
  return (
    <CrudPage
      title="Risks"
      description="Enterprise AI risk register with likelihood, impact, and mitigation owner."
      api={riskRegister}
      columns={[
        { key: 'risk_id', label: 'Risk ID' },
        { key: 'category', label: 'Category' },
        { key: 'likelihood', label: 'Likelihood', render: (v) => <span className={`badge ${v}`}>{v}</span> },
        { key: 'impact', label: 'Impact', render: (v) => <span className={`badge ${v}`}>{v}</span> },
        { key: 'owner', label: 'Owner' },
      ]}
      formFields={[
        { key: 'risk_id', label: 'Risk ID' },
        { key: 'category', label: 'Category' },
        { key: 'likelihood', label: 'Likelihood', type: 'select', options: LEVELS },
        { key: 'impact', label: 'Impact', type: 'select', options: LEVELS },
        { key: 'owner', label: 'Owner' },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
        { key: 'mitigation', label: 'Mitigation', type: 'textarea', full: true },
      ]}
      defaults={{ likelihood: 'medium', impact: 'medium' }}
    />
  );
}

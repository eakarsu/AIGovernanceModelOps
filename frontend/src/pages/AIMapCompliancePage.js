import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiMapCompliance } from '../services/api';

export default function AIMapCompliancePage() {
  return (
    <AIFormPage
      title="AI · Compliance Mapping"
      description="Map a system to applicable controls under EU AI Act, NIST AI RMF, or ISO/IEC 42001."
      runner={aiMapCompliance}
      featureKey="map_compliance"
      fields={[
        { key: 'system', label: 'System / Use-case', placeholder: 'CV resume screener for EU operations' },
        { key: 'riskTier', label: 'Risk Tier', type: 'select', options: ['minimal', 'limited', 'high', 'unacceptable'] },
        { key: 'framework', label: 'Framework', type: 'select', options: ['EU_AI_Act', 'NIST_RMF', 'ISO_42001'] },
        { key: 'description', label: 'Description', type: 'textarea', full: true, placeholder: 'What the system does, who is affected, data sources, autonomy.' },
      ]}
      defaults={{ system: 'CV resume screener for EU operations', riskTier: 'high', framework: 'EU_AI_Act' }}
    />
  );
}

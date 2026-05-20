import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiControlMapper } from '../services/api';

export default function AIControlMapperPage() {
  return (
    <AIFormPage
      title="AI · Control Mapper"
      description="Map a control to technical implementations + required evidence."
      runner={aiControlMapper}
      featureKey="control_mapper"
      fields={[
        { key: 'control_id', label: 'Control', placeholder: 'CTRL-001 / Art.9 / GOVERN-1.1' },
        { key: 'system', label: 'System', placeholder: 'customer-support-rag' },
      ]}
      defaults={{ control_id: 'CTRL-001', system: 'customer-support-rag' }}
    />
  );
}

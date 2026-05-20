import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiEnergyCost } from '../services/api';

export default function AIEnergyCostPage() {
  return (
    <AIFormPage
      title="AI · Energy & Cost"
      description="Forecast energy, carbon, and dollar cost of serving a model."
      runner={aiEnergyCost}
      featureKey="energy_cost"
      fields={[
        { key: 'model', label: 'Model', placeholder: 'gpt-4o' },
        { key: 'est_qps', label: 'Estimated QPS', type: 'number' },
      ]}
      defaults={{ model: 'gpt-4o', est_qps: 5 }}
    />
  );
}

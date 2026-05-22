import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiDriftNarrative } from '../services/api';

export default function AIDriftNarrativePage() {
  return (
    <AIFormPage
      title="AI · Drift Narrative"
      description="Longitudinal narrative over stored drift analyses — trend, inflection points, retrain recommendation. Past detect-drift runs for this model are auto-hydrated from the AI results store."
      runner={aiDriftNarrative}
      featureKey="drift_narrative"
      fields={[
        { key: 'model_id', label: 'Model ID', placeholder: 'internal-fraud-classifier-v7' },
        { key: 'horizon_days', label: 'Horizon (days)', type: 'number', placeholder: '90' },
      ]}
      defaults={{
        model_id: 'internal-fraud-classifier-v7',
        horizon_days: 90,
      }}
    />
  );
}

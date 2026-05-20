import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiFairnessCurve } from '../services/api';

export default function AIFairnessCurvePage() {
  return (
    <AIFormPage
      title="AI · Fairness Curve"
      description="Equal-opportunity curve across thresholds for a sensitive attribute."
      runner={aiFairnessCurve}
      featureKey="fairness_curve"
      fields={[
        { key: 'model_id', label: 'Model', placeholder: 'internal-fraud-classifier' },
        { key: 'sensitive_attr', label: 'Sensitive Attribute', type: 'select', options: ['gender', 'race', 'age_band', 'nationality', 'language'] },
      ]}
      defaults={{ model_id: 'internal-fraud-classifier', sensitive_attr: 'gender' }}
    />
  );
}

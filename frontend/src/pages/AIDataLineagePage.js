import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiDataLineage } from '../services/api';

export default function AIDataLineagePage() {
  return (
    <AIFormPage
      title="AI · Data Lineage"
      description="Trace dataset → training → deployment lineage for a model."
      runner={aiDataLineage}
      featureKey="data_lineage"
      fields={[
        { key: 'model_id', label: 'Model', placeholder: 'internal-fraud-classifier' },
      ]}
      defaults={{ model_id: 'internal-fraud-classifier' }}
    />
  );
}

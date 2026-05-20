import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiModelCardGenerator } from '../services/api';

export default function AIModelCardGeneratorPage() {
  return (
    <AIFormPage
      title="AI · Model Card Generator"
      description="Draft a Mitchell-style model card from a model identifier."
      runner={aiModelCardGenerator}
      featureKey="model_card_generator"
      fields={[
        { key: 'model_id', label: 'Model', placeholder: 'gpt-4o' },
      ]}
      defaults={{ model_id: 'gpt-4o' }}
    />
  );
}

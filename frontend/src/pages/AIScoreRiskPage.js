import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiScoreRisk } from '../services/api';

export default function AIScoreRiskPage() {
  return (
    <AIFormPage
      title="AI · Risk Scoring"
      description="Score a use-case against EU AI Act tiers and surface controls required."
      runner={aiScoreRisk}
      featureKey="score_risk"
      fields={[
        { key: 'useCase', label: 'Use-case', full: true, placeholder: 'Automated underwriting for consumer credit in EU' },
        { key: 'dataSensitivity', label: 'Data Sensitivity', type: 'select', options: ['public', 'internal', 'confidential', 'pii', 'special_category'] },
        { key: 'autonomy', label: 'Autonomy', type: 'select', options: ['human-in-the-loop', 'human-on-the-loop', 'fully-autonomous'] },
        { key: 'exposedPopulation', label: 'Exposed Population', type: 'select', options: ['internal', 'customers', 'general_public', 'minors_or_vulnerable'] },
        { key: 'modality', label: 'Modality', type: 'select', options: ['text', 'vision', 'audio', 'tabular', 'multimodal'] },
      ]}
      defaults={{
        useCase: 'Automated underwriting for consumer credit in EU',
        dataSensitivity: 'pii',
        autonomy: 'human-on-the-loop',
        exposedPopulation: 'customers',
        modality: 'tabular',
      }}
    />
  );
}

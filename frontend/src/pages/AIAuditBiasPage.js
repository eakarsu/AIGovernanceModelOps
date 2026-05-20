import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiAuditBias } from '../services/api';

export default function AIAuditBiasPage() {
  return (
    <AIFormPage
      title="AI · Bias Audit"
      description="Audit a model against a fairness metric and map findings to EU AI Act / NIST RMF / ISO 42001."
      runner={aiAuditBias}
      featureKey="audit_bias"
      fields={[
        { key: 'model', label: 'Model', placeholder: 'gpt-4o' },
        { key: 'dataset', label: 'Eval Dataset', placeholder: 'fairface' },
        { key: 'metric', label: 'Fairness Metric', type: 'select', options: ['demographic_parity', 'equal_opportunity', 'equalized_odds', 'calibration', 'WER_gap'] },
        { key: 'score', label: 'Observed Disparity / Score' },
        { key: 'notes', label: 'Notes', type: 'textarea', full: true, placeholder: 'Free-text context about the audit, subgroups, evaluation methodology, etc.' },
      ]}
      defaults={{ model: 'gemini-1.5-pro', dataset: 'fairface', metric: 'demographic_parity', score: '0.214' }}
    />
  );
}

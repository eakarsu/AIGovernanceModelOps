import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiDetectDrift } from '../services/api';

export default function AIDetectDriftPage() {
  return (
    <AIFormPage
      title="AI · Drift Detection"
      description="Diagnose data/concept drift in a production model and recommend response actions."
      runner={aiDetectDrift}
      featureKey="detect_drift"
      fields={[
        { key: 'model', label: 'Model', placeholder: 'internal-fraud-classifier' },
        { key: 'baselineMetric', label: 'Baseline Metric Value', type: 'number' },
        { key: 'currentMetric', label: 'Current Metric Value', type: 'number' },
        { key: 'window', label: 'Observation Window', placeholder: 'last 30 days' },
        { key: 'signal', label: 'Drift Signal', type: 'select', options: ['PSI', 'KS', 'JS_divergence', 'wasserstein', 'metric_delta'] },
      ]}
      defaults={{ model: 'internal-fraud-classifier', baselineMetric: 0.943, currentMetric: 0.871, window: 'last 30 days', signal: 'metric_delta' }}
    />
  );
}

import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiBiasSummary } from '../services/api';

export default function AIBiasSummaryPage() {
  return (
    <AIFormPage
      title="AI · Bias Summary (multi-audit roll-up)"
      description="Roll up multiple bias-audit runs for a model into a single leadership-ready summary. Past audit-bias runs for the model are auto-hydrated."
      runner={aiBiasSummary}
      featureKey="bias_summary"
      fields={[
        { key: 'model_id', label: 'Model ID', placeholder: 'resume-ranker-gpt4o-ft' },
        { key: 'period', label: 'Period', placeholder: 'last 4 quarters' },
      ]}
      defaults={{
        model_id: 'resume-ranker-gpt4o-ft',
        period: 'last 4 quarters',
      }}
    />
  );
}

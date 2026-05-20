import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiExplainDecision } from '../services/api';

export default function AIExplainDecisionPage() {
  return (
    <AIFormPage
      title="AI · Explain Decision"
      description="SHAP / LIME-style local explanation for a single model decision."
      runner={(p) => aiExplainDecision({ ...p, instance: tryParseJson(p.instance) })}
      featureKey="explain_decision"
      fields={[
        { key: 'model_id', label: 'Model', placeholder: 'internal-fraud-classifier' },
        { key: 'instance', label: 'Instance (JSON)', type: 'textarea', full: true, placeholder: '{"feature_a": 1.2, "feature_b": "EU"}' },
      ]}
      defaults={{ model_id: 'internal-fraud-classifier', instance: '{"claim_amount": 12500, "country": "DE", "prior_claims": 1}' }}
    />
  );
}

function tryParseJson(s) {
  if (typeof s !== 'string') return s;
  try { return JSON.parse(s); } catch (_) { return s; }
}

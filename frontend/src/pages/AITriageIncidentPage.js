import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiTriageIncident } from '../services/api';

export default function AITriageIncidentPage() {
  return (
    <AIFormPage
      title="AI · Incident Triage"
      description="Triage an AI incident — severity, regulatory notification, containment, and comms."
      runner={aiTriageIncident}
      featureKey="triage_incident"
      fields={[
        { key: 'model', label: 'Model', placeholder: 'gpt-4o' },
        { key: 'type', label: 'Incident Type', type: 'select', options: ['bias', 'drift', 'hallucination', 'security', 'privacy', 'other'] },
        { key: 'severity', label: 'Reported Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
        { key: 'description', label: 'Description', type: 'textarea', full: true, placeholder: 'What was observed, where, who is impacted.' },
      ]}
      defaults={{
        model: 'gpt-4o',
        type: 'hallucination',
        severity: 'medium',
        description: 'Customer-facing assistant produced fabricated regulatory citation in EU-zone tenant.',
      }}
    />
  );
}

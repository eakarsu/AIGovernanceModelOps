import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiRedteamTriage } from '../services/api';

export default function AIRedteamTriagePage() {
  return (
    <AIFormPage
      title="AI · Red-team Finding Triage"
      description="Triage an adversarial red-team finding — confirmed severity, exploitability, blast radius, mitigations, regulatory notification."
      runner={aiRedteamTriage}
      featureKey="redteam_triage"
      fields={[
        { key: 'finding_id', label: 'Finding ID', placeholder: 'RT-101' },
        { key: 'model', label: 'Model', placeholder: 'gpt-4o' },
        { key: 'technique', label: 'Attack Technique', placeholder: 'indirect_prompt_injection' },
        { key: 'severity', label: 'Reported Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
        { key: 'description', label: 'Description / Payload', type: 'textarea', full: true,
          placeholder: 'What was attempted, what got through, blast radius.' },
      ]}
      defaults={{
        finding_id: 'RT-101',
        model: 'gpt-4o',
        technique: 'indirect_prompt_injection',
        severity: 'high',
        description: 'Indirect prompt-injection via uploaded PDF caused agent to email internal source code externally.',
      }}
    />
  );
}

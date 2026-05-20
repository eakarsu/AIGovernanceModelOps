import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiJailbreakTest } from '../services/api';

export default function AIJailbreakTestPage() {
  return (
    <AIFormPage
      title="AI · Jailbreak Test"
      description="Resistance score + sample jailbreak attacks for a model."
      runner={aiJailbreakTest}
      featureKey="jailbreak_test"
      fields={[
        { key: 'model', label: 'Model', placeholder: 'claude-3-5-sonnet' },
      ]}
      defaults={{ model: 'claude-3-5-sonnet' }}
    />
  );
}

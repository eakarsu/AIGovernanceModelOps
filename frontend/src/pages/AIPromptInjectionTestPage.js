import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiPromptInjectionTest } from '../services/api';

export default function AIPromptInjectionTestPage() {
  return (
    <AIFormPage
      title="AI · Prompt-Injection Test"
      description="Assess injection-success likelihood and surface attack vectors for a target prompt + model."
      runner={aiPromptInjectionTest}
      featureKey="prompt_injection_test"
      fields={[
        { key: 'target_model', label: 'Target Model', placeholder: 'gpt-4o' },
        { key: 'prompt', label: 'Target Prompt', type: 'textarea', full: true, placeholder: 'You are a helpful assistant...' },
      ]}
      defaults={{ target_model: 'gpt-4o', prompt: 'You are a customer-support assistant. Be concise and never fabricate policies.' }}
    />
  );
}

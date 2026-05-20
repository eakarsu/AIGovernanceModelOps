import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiThirdPartyAssess } from '../services/api';

export default function AIThirdPartyAssessPage() {
  return (
    <AIFormPage
      title="AI · Third-Party Assessment"
      description="Risk + recommended controls for a third-party processor / integrator."
      runner={aiThirdPartyAssess}
      featureKey="third_party_assess"
      fields={[
        { key: 'party_id', label: 'Party ID / Name', placeholder: 'TP-001 OR OpenAI Inc.' },
      ]}
      defaults={{ party_id: 'TP-001' }}
    />
  );
}

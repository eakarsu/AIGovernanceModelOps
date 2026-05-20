import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiSspDrafter } from '../services/api';

export default function AISspDrafterPage() {
  return (
    <AIFormPage
      title="AI · SSP Drafter"
      description="Draft a System Security Plan outline for a target system + framework."
      runner={aiSspDrafter}
      featureKey="ssp_drafter"
      fields={[
        { key: 'system_name', label: 'System Name', placeholder: 'customer-support-rag' },
        { key: 'framework', label: 'Framework', type: 'select', options: ['NIST_RMF', 'ISO_42001'] },
      ]}
      defaults={{ system_name: 'customer-support-rag', framework: 'NIST_RMF' }}
    />
  );
}

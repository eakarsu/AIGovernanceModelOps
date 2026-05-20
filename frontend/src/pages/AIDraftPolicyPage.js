import React from 'react';
import AIFormPage from '../components/AIFormPage';
import { aiDraftPolicy } from '../services/api';

export default function AIDraftPolicyPage() {
  return (
    <AIFormPage
      title="AI · Policy Drafting"
      description="Draft an internal AI governance policy aligned to a chosen framework."
      runner={aiDraftPolicy}
      featureKey="draft_policy"
      fields={[
        { key: 'topic', label: 'Policy Topic', full: true, placeholder: 'Human oversight for high-risk AI systems' },
        { key: 'framework', label: 'Framework Alignment', type: 'select', options: ['EU_AI_Act', 'NIST_RMF', 'ISO_42001'] },
        { key: 'scope', label: 'Scope', full: true, placeholder: 'All production AI systems classified high-risk under EU AI Act Article 6.' },
        { key: 'owner', label: 'Policy Owner', placeholder: 'Head of AI Governance' },
      ]}
      defaults={{
        topic: 'Human oversight for high-risk AI systems',
        framework: 'EU_AI_Act',
        scope: 'All production AI systems classified high-risk under EU AI Act Article 6.',
        owner: 'Head of AI Governance',
      }}
    />
  );
}

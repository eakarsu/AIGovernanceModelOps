import React from 'react';
import CrudPage from '../components/CrudPage';
import { prompts } from '../services/api';

export default function PromptsPage() {
  return (
    <CrudPage
      title="Prompts"
      description="Versioned prompt library with owner, system message, and template."
      api={prompts}
      resourceKey="prompts"
      columns={[
        { key: 'prompt_id', label: 'Prompt ID' },
        { key: 'name', label: 'Name' },
        { key: 'version', label: 'Version' },
        { key: 'owner', label: 'Owner' },
        { key: 'last_used', label: 'Last Used' },
      ]}
      formFields={[
        { key: 'prompt_id', label: 'Prompt ID', placeholder: 'PR-011' },
        { key: 'name', label: 'Name' },
        { key: 'version', label: 'Version' },
        { key: 'owner', label: 'Owner' },
        { key: 'last_used', label: 'Last Used (YYYY-MM-DD)' },
        { key: 'system', label: 'System Prompt', type: 'textarea', full: true },
        { key: 'user_template', label: 'User Template', type: 'textarea', full: true },
      ]}
      defaults={{}}
    />
  );
}

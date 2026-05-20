import React from 'react';
import CrudPage from '../components/CrudPage';
import { controls } from '../services/api';

const FRAMEWORKS = ['EU_AI_Act', 'NIST_RMF', 'ISO_42001'];
const STATUSES   = ['implemented', 'partial', 'missing'];

export default function ControlsPage() {
  return (
    <CrudPage
      title="Controls"
      description="Mapped controls across EU AI Act, NIST AI RMF, and ISO 42001."
      api={controls}
      resourceKey="controls"
      columns={[
        { key: 'control_id', label: 'Control ID' },
        { key: 'framework', label: 'Framework' },
        { key: 'control_id_ext', label: 'External ID' },
        { key: 'title', label: 'Title' },
        { key: 'owner', label: 'Owner' },
        { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v}`}>{v || '—'}</span> },
        { key: 'last_tested', label: 'Last Tested' },
      ]}
      formFields={[
        { key: 'control_id', label: 'Control ID', placeholder: 'CTRL-013' },
        { key: 'framework', label: 'Framework', type: 'select', options: FRAMEWORKS },
        { key: 'control_id_ext', label: 'External ID', placeholder: 'Art.9 / GOVERN-1.1 / 6.1.2' },
        { key: 'title', label: 'Title' },
        { key: 'owner', label: 'Owner' },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES },
        { key: 'last_tested', label: 'Last Tested (YYYY-MM-DD)' },
      ]}
      defaults={{ framework: 'EU_AI_Act', status: 'partial' }}
    />
  );
}

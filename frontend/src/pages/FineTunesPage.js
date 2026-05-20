import React from 'react';
import CrudPage from '../components/CrudPage';
import { fineTunes } from '../services/api';

const STATUSES = ['promoted', 'sandbox', 'rolled_back'];

export default function FineTunesPage() {
  return (
    <CrudPage
      title="Fine Tunes"
      description="Fine-tuned model artefacts with eval scores and promotion status."
      api={fineTunes}
      resourceKey="fine_tunes"
      columns={[
        { key: 'ft_id', label: 'FT ID' },
        { key: 'base_model', label: 'Base Model' },
        { key: 'dataset', label: 'Dataset' },
        { key: 'run_id', label: 'Run ID' },
        { key: 'eval_score', label: 'Eval Score' },
        { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v}`}>{v || '—'}</span> },
      ]}
      formFields={[
        { key: 'ft_id', label: 'FT ID', placeholder: 'FT-011' },
        { key: 'base_model', label: 'Base Model' },
        { key: 'dataset', label: 'Dataset' },
        { key: 'run_id', label: 'Run ID' },
        { key: 'eval_score', label: 'Eval Score', type: 'number' },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES },
      ]}
      defaults={{ status: 'sandbox' }}
    />
  );
}

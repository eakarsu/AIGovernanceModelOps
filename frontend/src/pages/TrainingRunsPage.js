import React from 'react';
import CrudPage from '../components/CrudPage';
import { trainingRuns } from '../services/api';

const STATUSES = ['complete', 'failed'];

export default function TrainingRunsPage() {
  return (
    <CrudPage
      title="Training Runs"
      description="GPU-hours, cost, and outcome for each model training run."
      api={trainingRuns}
      resourceKey="training_runs"
      columns={[
        { key: 'run_id', label: 'Run ID' },
        { key: 'model', label: 'Model' },
        { key: 'dataset', label: 'Dataset' },
        { key: 'hours', label: 'Hours' },
        { key: 'gpu_count', label: 'GPUs' },
        { key: 'cost_usd', label: 'Cost (USD)' },
        { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v}`}>{v || '—'}</span> },
        { key: 'finished_at', label: 'Finished' },
      ]}
      formFields={[
        { key: 'run_id', label: 'Run ID', placeholder: 'TR-011' },
        { key: 'model', label: 'Model' },
        { key: 'dataset', label: 'Dataset' },
        { key: 'hours', label: 'Hours', type: 'number' },
        { key: 'gpu_count', label: 'GPU Count', type: 'number' },
        { key: 'cost_usd', label: 'Cost (USD)', type: 'number' },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES },
        { key: 'finished_at', label: 'Finished At (YYYY-MM-DD)' },
      ]}
      defaults={{ status: 'complete' }}
    />
  );
}

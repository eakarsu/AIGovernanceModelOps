import React from 'react';
import CrudPage from '../components/CrudPage';
import { evaluations } from '../services/api';

export default function EvaluationsPage() {
  return (
    <CrudPage
      title="Evaluations"
      description="Benchmark and fairness evaluation runs. Failures trigger governance review."
      api={evaluations}
      columns={[
        { key: 'eval_id', label: 'Eval ID' },
        { key: 'model', label: 'Model' },
        { key: 'dataset', label: 'Dataset' },
        { key: 'metric', label: 'Metric' },
        { key: 'score', label: 'Score' },
        { key: 'passed', label: 'Result', render: (v) => v ? <span className="badge passed">pass</span> : <span className="badge fail">fail</span> },
        { key: 'run_at', label: 'Run At' },
      ]}
      formFields={[
        { key: 'eval_id', label: 'Eval ID' },
        { key: 'model', label: 'Model' },
        { key: 'dataset', label: 'Dataset' },
        { key: 'metric', label: 'Metric', placeholder: 'accuracy / AUROC / BLEU / demographic_parity' },
        { key: 'score', label: 'Score', type: 'number' },
        { key: 'run_at', label: 'Run At (YYYY-MM-DD)' },
        { key: 'passed', label: 'Passed?', type: 'checkbox' },
      ]}
      defaults={{ passed: true }}
    />
  );
}

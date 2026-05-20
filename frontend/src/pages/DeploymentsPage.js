import React from 'react';
import CrudPage from '../components/CrudPage';
import { deployments } from '../services/api';

const ENVS = ['production', 'staging', 'pilot', 'restricted', 'deprecated'];

export default function DeploymentsPage() {
  return (
    <CrudPage
      title="Deployments"
      description="Where each model version is live, in which region, owned by which team."
      api={deployments}
      columns={[
        { key: 'deployment_id', label: 'Deployment ID' },
        { key: 'model', label: 'Model' },
        { key: 'env', label: 'Env', render: (v) => <span className={`badge ${v === 'production' ? 'active' : v === 'pilot' ? 'pilot' : v === 'deprecated' ? 'fail' : 'draft'}`}>{v}</span> },
        { key: 'region', label: 'Region' },
        { key: 'version', label: 'Version' },
        { key: 'owner', label: 'Owner' },
        { key: 'deployed_at', label: 'Deployed' },
      ]}
      formFields={[
        { key: 'deployment_id', label: 'Deployment ID' },
        { key: 'model', label: 'Model' },
        { key: 'env', label: 'Environment', type: 'select', options: ENVS },
        { key: 'region', label: 'Region', placeholder: 'eu-west-1 / us-east-1 / ...' },
        { key: 'version', label: 'Version' },
        { key: 'deployed_at', label: 'Deployed At (YYYY-MM-DD)' },
        { key: 'owner', label: 'Owner team' },
      ]}
      defaults={{ env: 'staging' }}
    />
  );
}

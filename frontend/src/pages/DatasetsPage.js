import React from 'react';
import CrudPage from '../components/CrudPage';
import { datasets } from '../services/api';

const SENSITIVITY = ['public', 'restricted', 'confidential', 'pii'];

export default function DatasetsPage() {
  return (
    <CrudPage
      title="Datasets"
      description="Training and evaluation datasets with sensitivity, license, and PII flag."
      api={datasets}
      columns={[
        { key: 'dataset_id', label: 'Dataset ID' },
        { key: 'name', label: 'Name' },
        { key: 'source', label: 'Source' },
        { key: 'sensitivity', label: 'Sensitivity', render: (v) => <span className={`badge ${v}`}>{v || '—'}</span> },
        { key: 'size_rows', label: 'Rows' },
        { key: 'license', label: 'License' },
        { key: 'pii_present', label: 'PII', render: (v) => v ? <span className="badge high">yes</span> : <span className="badge low">no</span> },
      ]}
      formFields={[
        { key: 'dataset_id', label: 'Dataset ID' },
        { key: 'name', label: 'Name' },
        { key: 'source', label: 'Source' },
        { key: 'sensitivity', label: 'Sensitivity', type: 'select', options: SENSITIVITY },
        { key: 'size_rows', label: 'Size (rows)', type: 'number' },
        { key: 'license', label: 'License' },
        { key: 'registered_at', label: 'Registered At (YYYY-MM-DD)' },
        { key: 'pii_present', label: 'PII present?', type: 'checkbox' },
      ]}
      defaults={{ sensitivity: 'public', pii_present: false }}
    />
  );
}

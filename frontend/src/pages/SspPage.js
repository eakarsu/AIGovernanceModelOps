import React from 'react';
import CrudPage from '../components/CrudPage';
import { ssp } from '../services/api';

const FRAMEWORKS = ['NIST_RMF', 'ISO_42001'];
const STATUSES   = ['draft', 'approved', 'expired'];

export default function SspPage() {
  return (
    <CrudPage
      title="SSPs"
      description="System Security Plans aligned to NIST AI RMF or ISO/IEC 42001."
      api={ssp}
      resourceKey="ssp"
      columns={[
        { key: 'ssp_id', label: 'SSP ID' },
        { key: 'system_name', label: 'System' },
        { key: 'framework', label: 'Framework' },
        { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v}`}>{v || '—'}</span> },
        { key: 'owner', label: 'Owner' },
        { key: 'version', label: 'Version' },
      ]}
      formFields={[
        { key: 'ssp_id', label: 'SSP ID', placeholder: 'SSP-011' },
        { key: 'system_name', label: 'System Name' },
        { key: 'framework', label: 'Framework', type: 'select', options: FRAMEWORKS },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES },
        { key: 'owner', label: 'Owner' },
        { key: 'version', label: 'Version' },
      ]}
      defaults={{ framework: 'NIST_RMF', status: 'draft' }}
    />
  );
}

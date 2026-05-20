import React from 'react';
import CrudPage from '../components/CrudPage';
import { dpiaRecords } from '../services/api';

const RISK = ['low', 'medium', 'high', 'critical'];

export default function DpiaRecordsPage() {
  return (
    <CrudPage
      title="DPIA Records"
      description="Data Protection Impact Assessments for systems handling personal data."
      api={dpiaRecords}
      resourceKey="dpia_records"
      columns={[
        { key: 'dpia_id', label: 'DPIA ID' },
        { key: 'system', label: 'System' },
        { key: 'data_categories', label: 'Data Categories' },
        { key: 'residual_risk', label: 'Residual Risk', render: (v) => <span className={`badge ${v}`}>{v || '—'}</span> },
        { key: 'approved_by', label: 'Approved By' },
        { key: 'approved_at', label: 'Approved At' },
      ]}
      formFields={[
        { key: 'dpia_id', label: 'DPIA ID', placeholder: 'DPIA-011' },
        { key: 'system', label: 'System' },
        { key: 'data_categories', label: 'Data Categories' },
        { key: 'residual_risk', label: 'Residual Risk', type: 'select', options: RISK },
        { key: 'approved_by', label: 'Approved By' },
        { key: 'approved_at', label: 'Approved At (YYYY-MM-DD)' },
        { key: 'scope', label: 'Scope', type: 'textarea', full: true },
        { key: 'mitigations', label: 'Mitigations', type: 'textarea', full: true },
      ]}
      defaults={{ residual_risk: 'low' }}
    />
  );
}

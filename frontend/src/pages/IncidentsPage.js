import React from 'react';
import CrudPage from '../components/CrudPage';
import { incidents } from '../services/api';

const TYPES = ['bias', 'drift', 'hallucination', 'security', 'privacy', 'other'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'investigating', 'mitigating', 'closed'];

export default function IncidentsPage() {
  return (
    <CrudPage
      title="Incidents"
      description="Bias, drift, hallucination, and security incidents with severity and status."
      api={incidents}
      columns={[
        { key: 'incident_id', label: 'Incident ID' },
        { key: 'model', label: 'Model' },
        { key: 'type', label: 'Type' },
        { key: 'severity', label: 'Severity', render: (v) => <span className={`badge ${v}`}>{v}</span> },
        { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v === 'closed' ? 'low' : v === 'open' ? 'high' : 'medium'}`}>{v}</span> },
        { key: 'opened_at', label: 'Opened' },
      ]}
      formFields={[
        { key: 'incident_id', label: 'Incident ID' },
        { key: 'model', label: 'Model' },
        { key: 'type', label: 'Type', type: 'select', options: TYPES },
        { key: 'severity', label: 'Severity', type: 'select', options: SEVERITIES },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES },
        { key: 'opened_at', label: 'Opened At (YYYY-MM-DD HH:MM:SS)' },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
      ]}
      defaults={{ type: 'bias', severity: 'medium', status: 'open' }}
    />
  );
}

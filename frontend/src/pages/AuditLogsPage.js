import React from 'react';
import CrudPage from '../components/CrudPage';
import { auditLogs } from '../services/api';

export default function AuditLogsPage() {
  return (
    <CrudPage
      title="Audit Logs"
      description="Immutable record of governance and operational actions across the AI estate."
      api={auditLogs}
      columns={[
        { key: 'log_id', label: 'Log ID' },
        { key: 'actor', label: 'Actor' },
        { key: 'action', label: 'Action' },
        { key: 'target', label: 'Target' },
        { key: 'model_version', label: 'Model Version' },
        { key: 'timestamp', label: 'Timestamp' },
      ]}
      formFields={[
        { key: 'log_id', label: 'Log ID' },
        { key: 'actor', label: 'Actor (email)' },
        { key: 'action', label: 'Action', placeholder: 'model.deploy / policy.publish / incident.open' },
        { key: 'target', label: 'Target' },
        { key: 'timestamp', label: 'Timestamp (YYYY-MM-DD HH:MM:SS)' },
        { key: 'model_version', label: 'Model Version' },
      ]}
      defaults={{}}
    />
  );
}

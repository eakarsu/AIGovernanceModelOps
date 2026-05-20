import React from 'react';
import CrudPage from '../components/CrudPage';
import { thirdParties } from '../services/api';

const ROLES = ['processor', 'sub-processor', 'integrator'];

export default function ThirdPartiesPage() {
  return (
    <CrudPage
      title="Third Parties"
      description="Processors, sub-processors, and integrators in scope of AI governance."
      api={thirdParties}
      resourceKey="third_parties"
      columns={[
        { key: 'party_id', label: 'Party ID' },
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role' },
        { key: 'dpia_required', label: 'DPIA Req.' },
        { key: 'contract_expires', label: 'Contract Expires' },
      ]}
      formFields={[
        { key: 'party_id', label: 'Party ID', placeholder: 'TP-011' },
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role', type: 'select', options: ROLES },
        { key: 'dpia_required', label: 'DPIA Required', type: 'checkbox' },
        { key: 'contract_expires', label: 'Contract Expires (YYYY-MM-DD)' },
      ]}
      defaults={{ role: 'processor', dpia_required: false }}
    />
  );
}

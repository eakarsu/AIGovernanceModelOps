import React from 'react';
import CrudPage from '../components/CrudPage';
import { modelCards } from '../services/api';

export default function ModelCardsPage() {
  return (
    <CrudPage
      title="Model Cards"
      description="Mitchell-style model cards capturing intended use, limitations, and ethical considerations."
      api={modelCards}
      resourceKey="model_cards"
      columns={[
        { key: 'card_id', label: 'Card ID' },
        { key: 'model', label: 'Model' },
        { key: 'version', label: 'Version' },
        { key: 'owners', label: 'Owners' },
        { key: 'updated_at', label: 'Updated' },
      ]}
      formFields={[
        { key: 'card_id', label: 'Card ID', placeholder: 'MC-011' },
        { key: 'model', label: 'Model' },
        { key: 'version', label: 'Version' },
        { key: 'owners', label: 'Owners' },
        { key: 'intended_use', label: 'Intended Use', type: 'textarea', full: true },
        { key: 'limitations', label: 'Limitations', type: 'textarea', full: true },
        { key: 'ethical_considerations', label: 'Ethical Considerations', type: 'textarea', full: true },
      ]}
      defaults={{}}
    />
  );
}

import React from 'react';
import ModelDriftTrendChart from '../components/ModelDriftTrendChart';
import BiasDetectionHeatmap from '../components/BiasDetectionHeatmap';
import GovernanceCardPdf from '../components/GovernanceCardPdf';
import PolicyRulesEditor from '../components/PolicyRulesEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page">
      <div className="page-header">
        <div>
          <h2>MLGov Views</h2>
          <p>
            Cross-cutting model-governance views: drift trends, bias heatmap, governance/model-card
            PDF export, and editable ML policy rules (approval gates &amp; retraining thresholds).
          </p>
        </div>
      </div>

      <ModelDriftTrendChart />
      <BiasDetectionHeatmap />
      <GovernanceCardPdf />
      <PolicyRulesEditor />
    </div>
  );
}

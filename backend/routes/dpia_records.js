const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'dpia_records',
  idField: 'dpia_id',
  columns: ['dpia_id', 'system', 'scope', 'data_categories', 'mitigations', 'residual_risk', 'approved_by', 'approved_at'],
});

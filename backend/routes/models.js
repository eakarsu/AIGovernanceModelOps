const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'models',
  idField: 'model_id',
  columns: ['model_id', 'name', 'provider', 'version', 'owner', 'deployed_at', 'risk_tier', 'status'],
});

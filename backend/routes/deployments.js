const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'deployments',
  idField: 'deployment_id',
  columns: ['deployment_id', 'model', 'env', 'region', 'version', 'deployed_at', 'owner'],
});

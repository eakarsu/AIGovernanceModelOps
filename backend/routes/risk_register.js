const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'risk_register',
  idField: 'risk_id',
  columns: ['risk_id', 'category', 'description', 'likelihood', 'impact', 'mitigation', 'owner'],
});

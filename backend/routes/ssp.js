const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'ssp',
  idField: 'ssp_id',
  columns: ['ssp_id', 'system_name', 'framework', 'status', 'owner', 'version'],
});

const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'datasets',
  idField: 'dataset_id',
  columns: ['dataset_id', 'name', 'source', 'sensitivity', 'size_rows', 'license', 'registered_at', 'pii_present'],
});

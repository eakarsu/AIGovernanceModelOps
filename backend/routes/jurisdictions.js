const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'jurisdictions',
  idField: 'juris_id',
  columns: ['juris_id', 'country', 'regulation', 'applicable_systems', 'status'],
});

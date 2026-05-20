const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'policies',
  idField: 'policy_id',
  columns: ['policy_id', 'name', 'framework', 'scope', 'status', 'owner'],
});

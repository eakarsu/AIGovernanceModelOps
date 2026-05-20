const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'controls',
  idField: 'control_id',
  columns: ['control_id', 'framework', 'control_id_ext', 'title', 'owner', 'status', 'last_tested'],
});

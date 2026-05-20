const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'audit_logs',
  idField: 'log_id',
  columns: ['log_id', 'actor', 'action', 'target', 'timestamp', 'model_version'],
});

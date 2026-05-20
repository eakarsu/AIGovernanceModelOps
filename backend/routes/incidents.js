const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'incidents',
  idField: 'incident_id',
  columns: ['incident_id', 'model', 'type', 'severity', 'status', 'opened_at', 'description'],
});

const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'redteam_findings',
  idField: 'finding_id',
  columns: ['finding_id', 'model', 'technique', 'severity', 'status', 'found_at'],
});

const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'evaluations',
  idField: 'eval_id',
  columns: ['eval_id', 'model', 'dataset', 'metric', 'score', 'run_at', 'passed'],
});

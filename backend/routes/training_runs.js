const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'training_runs',
  idField: 'run_id',
  columns: ['run_id', 'model', 'dataset', 'hours', 'gpu_count', 'cost_usd', 'status', 'finished_at'],
});

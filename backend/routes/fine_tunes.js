const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'fine_tunes',
  idField: 'ft_id',
  columns: ['ft_id', 'base_model', 'dataset', 'run_id', 'eval_score', 'status'],
});

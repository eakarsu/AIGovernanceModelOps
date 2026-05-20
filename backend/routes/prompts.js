const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'prompts',
  idField: 'prompt_id',
  columns: ['prompt_id', 'name', 'system', 'user_template', 'version', 'owner', 'last_used'],
});

const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'third_parties',
  idField: 'party_id',
  columns: ['party_id', 'name', 'role', 'dpia_required', 'contract_expires'],
});

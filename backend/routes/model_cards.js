const { buildCrudRouter } = require('../services/crud');

module.exports = buildCrudRouter({
  table: 'model_cards',
  idField: 'card_id',
  columns: ['card_id', 'model', 'version', 'owners', 'intended_use', 'limitations', 'ethical_considerations'],
});

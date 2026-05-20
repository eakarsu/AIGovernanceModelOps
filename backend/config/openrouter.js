require('dotenv').config({ path: '../.env' });

module.exports = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
  OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',
  APP_TITLE: 'AI Governance ModelOps',
};

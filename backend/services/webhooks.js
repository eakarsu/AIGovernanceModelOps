const crypto = require('crypto');
const pool = require('../config/database');

// Fire webhooks for an event. Looks up active webhooks subscribed to `event`,
// signs the payload with HMAC-SHA256, POSTs JSON, and records the delivery.
async function fireWebhooks(event, payload) {
  let hooks;
  try {
    const r = await pool.query(
      `SELECT * FROM webhooks WHERE active = true AND (events ILIKE '%' || $1 || '%' OR events ILIKE '%*%')`,
      [event]
    );
    hooks = r.rows;
  } catch (e) {
    console.error('[webhooks.lookup]', e.message);
    return;
  }

  for (const hook of hooks) {
    const body = JSON.stringify({ event, payload, ts: new Date().toISOString() });
    const signature = hook.secret
      ? crypto.createHmac('sha256', hook.secret).update(body).digest('hex')
      : '';

    let statusCode = 0;
    let responseText = '';
    try {
      const res = await fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AIGov-Event': event,
          'X-AIGov-Signature': signature,
        },
        body,
      });
      statusCode = res.status;
      responseText = (await res.text()).slice(0, 500);
    } catch (e) {
      statusCode = 0;
      responseText = `network_error: ${e.message}`;
    }

    try {
      await pool.query(
        `INSERT INTO webhook_deliveries (webhook_id, event, payload, status_code, response, signature)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [hook.webhook_id, event, JSON.stringify(payload || {}), statusCode, responseText, signature]
      );
    } catch (e) {
      console.error('[webhooks.delivery.record]', e.message);
    }
  }
}

module.exports = { fireWebhooks };

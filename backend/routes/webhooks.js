const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { fireWebhooks } = require('../services/webhooks');

// List webhooks
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`SELECT id, webhook_id, url, events, active, created_at, updated_at FROM webhooks ORDER BY id DESC`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create
router.post('/', async (req, res) => {
  try {
    const { url, secret, events, active } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url required' });
    const webhook_id = `WH-${Date.now()}`;
    const r = await pool.query(
      `INSERT INTO webhooks (webhook_id, url, secret, events, active) VALUES ($1,$2,$3,$4,$5)
       RETURNING id, webhook_id, url, events, active, created_at`,
      [webhook_id, url, secret || null, events || 'incident.opened,eval.failed,control.test.failed', active === undefined ? true : !!active]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const { url, secret, events, active } = req.body || {};
    const r = await pool.query(
      `UPDATE webhooks SET
         url = COALESCE($1, url),
         secret = COALESCE($2, secret),
         events = COALESCE($3, events),
         active = COALESCE($4, active),
         updated_at = NOW()
       WHERE id = $5 RETURNING id, webhook_id, url, events, active, updated_at`,
      [url || null, secret || null, events || null, active === undefined ? null : !!active, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query(`DELETE FROM webhooks WHERE id = $1 RETURNING id, webhook_id`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Fire a test event manually
router.post('/test', async (req, res) => {
  try {
    const { event = 'test.event', payload = {} } = req.body || {};
    await fireWebhooks(event, payload);
    res.json({ fired: true, event });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delivery log
router.get('/deliveries', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, webhook_id, event, status_code, response, signature, delivered_at
       FROM webhook_deliveries ORDER BY id DESC LIMIT 200`
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

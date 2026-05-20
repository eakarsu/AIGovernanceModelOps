const express = require('express');
const router = express.Router();
const { listNotifications, unreadCount, markRead, markAllRead, addNotification } = require('../services/notifications');

router.get('/', async (req, res) => {
  try {
    const email = req.user?.email || null;
    const rows = await listNotifications({ user_email: email });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/unread-count', async (req, res) => {
  try {
    const email = req.user?.email || null;
    res.json({ count: await unreadCount({ user_email: email }) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const row = await addNotification(req.body || {});
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/read', async (req, res) => {
  try {
    const row = await markRead(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/read-all', async (req, res) => {
  try {
    await markAllRead(req.user?.email || null);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

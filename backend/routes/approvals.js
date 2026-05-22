// Approval workflow state machine — Apply pass 7
// Resource: approvals
// States: pending → under_review → approved | rejected
// Each transition requires an approver_id (from the authenticated user).
//
// Endpoints:
//   GET    /api/approvals                       list approvals
//   GET    /api/approvals/:id                   get one (with history)
//   POST   /api/approvals                       create new approval request
//                                                body: { resource_type, resource_id, requested_by, notes }
//   POST   /api/approvals/:id/transition        body: { to_state, approver_id, notes }
//   DELETE /api/approvals/:id                   delete (admin path)
const express = require('express');
const pool = require('../config/database');
const { fireWebhooks } = require('../services/webhooks');
const { addNotification } = require('../services/notifications');

const router = express.Router();

const VALID_STATES = ['pending', 'under_review', 'approved', 'rejected'];

// Allowed transitions. Terminal states cannot transition further.
const TRANSITIONS = {
  pending:      ['under_review', 'rejected'],
  under_review: ['approved', 'rejected', 'pending'],
  approved:     [],
  rejected:     [],
};

function isValidTransition(from, to) {
  if (!VALID_STATES.includes(from) || !VALID_STATES.includes(to)) return false;
  return (TRANSITIONS[from] || []).includes(to);
}

// LIST
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM approvals ORDER BY id DESC`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET one (+ history)
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM approvals WHERE id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    const h = await pool.query(
      `SELECT * FROM approval_history WHERE approval_id = $1 ORDER BY id ASC`,
      [r.rows[0].approval_id]
    );
    res.json({ ...r.rows[0], history: h.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CREATE (always starts in 'pending')
router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const resource_type = b.resource_type || b.resource || null;
    const resource_id   = b.resource_id || null;
    const requested_by  = b.requested_by || req.user?.email || req.user?.id || null;
    const notes         = b.notes || null;

    if (!resource_type) return res.status(400).json({ error: 'resource_type required' });
    if (!resource_id)   return res.status(400).json({ error: 'resource_id required' });
    if (!requested_by)  return res.status(400).json({ error: 'requested_by required' });

    const approval_id = b.approval_id || `APR-${Date.now()}`;
    const r = await pool.query(
      `INSERT INTO approvals
         (approval_id, resource_type, resource_id, state, requested_by, notes)
       VALUES ($1, $2, $3, 'pending', $4, $5)
       RETURNING *`,
      [approval_id, resource_type, resource_id, requested_by, notes]
    );
    const row = r.rows[0];

    await pool.query(
      `INSERT INTO approval_history
         (approval_id, from_state, to_state, actor_id, notes)
       VALUES ($1, NULL, 'pending', $2, $3)`,
      [approval_id, requested_by, notes]
    );

    addNotification({
      kind: 'approval.requested',
      title: `Approval requested: ${resource_type}/${resource_id}`,
      body: notes || '',
      resource: 'approvals',
      resource_id: approval_id,
    }).catch(() => {});
    fireWebhooks('approval.requested', row).catch(() => {});

    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// TRANSITION
router.post('/:id/transition', async (req, res) => {
  try {
    const b = req.body || {};
    const to_state    = String(b.to_state || '').trim();
    const approver_id = b.approver_id || req.user?.email || req.user?.id || null;
    const notes       = b.notes || null;

    if (!VALID_STATES.includes(to_state)) {
      return res.status(400).json({ error: `to_state must be one of ${VALID_STATES.join(', ')}` });
    }
    if (!approver_id) {
      return res.status(400).json({ error: 'approver_id is required for any state transition' });
    }

    const cur = await pool.query(`SELECT * FROM approvals WHERE id = $1`, [req.params.id]);
    if (!cur.rows.length) return res.status(404).json({ error: 'Not found' });
    const row = cur.rows[0];
    const from_state = row.state;

    if (!isValidTransition(from_state, to_state)) {
      return res.status(409).json({
        error: `Illegal transition: ${from_state} → ${to_state}`,
        allowed_from_current: TRANSITIONS[from_state] || [],
      });
    }

    // approved / rejected are terminal — stamp approver + decided_at
    const isTerminal = to_state === 'approved' || to_state === 'rejected';
    const upd = await pool.query(
      `UPDATE approvals
         SET state = $1,
             approver_id = COALESCE($2, approver_id),
             decided_at  = CASE WHEN $3 THEN NOW() ELSE decided_at END,
             updated_at  = NOW()
       WHERE id = $4
       RETURNING *`,
      [to_state, approver_id, isTerminal, req.params.id]
    );
    const updated = upd.rows[0];

    await pool.query(
      `INSERT INTO approval_history
         (approval_id, from_state, to_state, actor_id, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [updated.approval_id, from_state, to_state, approver_id, notes]
    );

    const evt = `approval.${to_state.replace(/_/g, '.')}`;
    addNotification({
      kind: evt,
      title: `Approval ${to_state}: ${updated.resource_type}/${updated.resource_id}`,
      body: notes || '',
      resource: 'approvals',
      resource_id: updated.approval_id,
    }).catch(() => {});
    fireWebhooks(evt, updated).catch(() => {});

    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE (admin-only path; role gate happens in middleware)
router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query(`DELETE FROM approvals WHERE id = $1 RETURNING *`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    // history rows preserved intentionally (audit trail)
    res.json({ message: 'Deleted', row: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Exposed for tests / introspection
router.get('/_meta/states', (req, res) => res.json({
  states: VALID_STATES,
  transitions: TRANSITIONS,
}));

module.exports = router;

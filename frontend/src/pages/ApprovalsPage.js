import React, { useEffect, useState } from 'react';
import { approvals, currentUser, isAuditor } from '../services/api';

// Apply pass 7 — Approval workflow state machine UI
// States: pending → under_review → approved | rejected
// Every transition requires an approver_id.
const STATES = ['pending', 'under_review', 'approved', 'rejected'];
const RESOURCE_TYPES = ['model', 'deployment', 'policy', 'model_card', 'ssp', 'dpia', 'fine_tune', 'prompt'];

export default function ApprovalsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    resource_type: 'model',
    resource_id: '',
    notes: '',
  });
  const [transitioning, setTransitioning] = useState(false);
  const [transitionForm, setTransitionForm] = useState({
    to_state: 'under_review',
    approver_id: '',
    notes: '',
  });
  const readOnly = isAuditor();
  const me = currentUser();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try { setItems(await approvals.list()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function openDetail(row) {
    setSelected(row);
    setHistory([]);
    try {
      const full = await approvals.get(row.id);
      setSelected(full);
      setHistory(full.history || []);
      setTransitionForm({
        to_state: nextDefault(full.state),
        approver_id: me?.email || me?.id || '',
        notes: '',
      });
    } catch (e) { alert(e.message); }
  }

  function nextDefault(state) {
    if (state === 'pending') return 'under_review';
    if (state === 'under_review') return 'approved';
    return state;
  }

  async function handleCreate() {
    if (!form.resource_id) return alert('resource_id is required');
    try {
      const requested_by = me?.email || me?.id || 'unknown';
      await approvals.create({ ...form, requested_by });
      setCreating(false);
      setForm({ resource_type: 'model', resource_id: '', notes: '' });
      load();
    } catch (e) { alert(e.message); }
  }

  async function handleTransition() {
    if (!selected) return;
    if (!transitionForm.approver_id) {
      return alert('approver_id is required for any state transition');
    }
    try {
      await approvals.transition(selected.id, transitionForm);
      setTransitioning(false);
      const full = await approvals.get(selected.id);
      setSelected(full);
      setHistory(full.history || []);
      load();
    } catch (e) { alert(e.message); }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Delete approval ${row.approval_id}? (history is preserved)`)) return;
    try { await approvals.remove(row.id); if (selected?.id === row.id) setSelected(null); load(); }
    catch (e) { alert(e.message); }
  }

  const visible = filter === 'all' ? items : items.filter((r) => r.state === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Approvals</h2>
          <p>
            Approval workflow state machine — <code>pending → under_review → approved | rejected</code>.
            Every transition records an <code>approver_id</code> in the audit trail.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All states</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {!readOnly && (
            <button className="btn" onClick={() => setCreating(true)}>+ New approval</button>
          )}
        </div>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className="ai-error">{error}</div>}

      <div className="table-wrap table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Resource</th>
              <th>State</th>
              <th>Requested by</th>
              <th>Approver</th>
              <th>Decided at</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="clickable" onClick={() => openDetail(r)}>
                <td>{r.approval_id}</td>
                <td>{r.resource_type} / {r.resource_id}</td>
                <td><span className={`badge ${stateBadge(r.state)}`}>{r.state}</span></td>
                <td>{r.requested_by}</td>
                <td>{r.approver_id || '—'}</td>
                <td>{r.decided_at ? new Date(r.decided_at).toLocaleString() : '—'}</td>
                <td>
                  {!readOnly && (
                    <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); handleDelete(r); }}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>No approvals.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="modal-overlay" onClick={() => setCreating(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New approval request</h3>
              <button className="modal-close" onClick={() => setCreating(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Resource type</label>
                  <select value={form.resource_type} onChange={(e) => setForm({ ...form, resource_type: e.target.value })}>
                    {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Resource ID</label>
                  <input
                    type="text"
                    value={form.resource_id}
                    onChange={(e) => setForm({ ...form, resource_id: e.target.value })}
                    placeholder="internal-fraud-classifier-v7"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Why this approval is being requested."
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn" onClick={handleCreate}>Create (pending)</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <h3>{selected.approval_id} — {selected.resource_type}/{selected.resource_id}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <strong>State:</strong> <span className={`badge ${stateBadge(selected.state)}`}>{selected.state}</span><br/>
                <strong>Requested by:</strong> {selected.requested_by}<br/>
                <strong>Approver:</strong> {selected.approver_id || '—'}<br/>
                <strong>Decided at:</strong> {selected.decided_at ? new Date(selected.decided_at).toLocaleString() : '—'}<br/>
                <strong>Notes:</strong> {selected.notes || '—'}
              </div>

              {!isTerminal(selected.state) && !readOnly && (
                <div className="table-wrap" style={{ padding: 12, marginBottom: 12 }}>
                  <h4 style={{ marginTop: 0 }}>Transition</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>To state</label>
                      <select
                        value={transitionForm.to_state}
                        onChange={(e) => setTransitionForm({ ...transitionForm, to_state: e.target.value })}
                      >
                        {allowedNext(selected.state).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Approver ID (required)</label>
                      <input
                        type="text"
                        value={transitionForm.approver_id}
                        onChange={(e) => setTransitionForm({ ...transitionForm, approver_id: e.target.value })}
                        placeholder="risk-officer@example.com"
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Notes</label>
                      <textarea
                        value={transitionForm.notes}
                        onChange={(e) => setTransitionForm({ ...transitionForm, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <button className="btn" onClick={handleTransition} disabled={transitioning}>
                    Apply transition
                  </button>
                </div>
              )}

              <h4>History</h4>
              <table className="data-table">
                <thead><tr><th>When</th><th>From</th><th>To</th><th>Actor</th><th>Notes</th></tr></thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{new Date(h.created_at).toLocaleString()}</td>
                      <td>{h.from_state || '—'}</td>
                      <td><span className={`badge ${stateBadge(h.to_state)}`}>{h.to_state}</span></td>
                      <td>{h.actor_id}</td>
                      <td>{h.notes || '—'}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={5} style={{ color: '#94a3b8' }}>No history yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function stateBadge(state) {
  if (state === 'approved') return 'mitigated';
  if (state === 'rejected') return 'critical';
  if (state === 'under_review') return 'medium';
  return 'low';
}

function isTerminal(s) { return s === 'approved' || s === 'rejected'; }

function allowedNext(state) {
  if (state === 'pending') return ['under_review', 'rejected'];
  if (state === 'under_review') return ['approved', 'rejected', 'pending'];
  return [];
}

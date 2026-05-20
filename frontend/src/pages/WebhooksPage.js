import React, { useEffect, useState } from 'react';
import { webhooks as webhookApi, isAuditor } from '../services/api';

const KNOWN_EVENTS = ['incident.opened', 'eval.failed', 'control.test.failed', 'ai.alert', 'redteam.finding.high'];

export default function WebhooksPage() {
  const [items, setItems] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ url: '', secret: '', events: KNOWN_EVENTS.join(','), active: true });
  const readOnly = isAuditor();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setItems(await webhookApi.list());
      setDeliveries(await webhookApi.deliveries());
    } catch (e) { console.error(e); }
  }

  async function save() {
    try {
      await webhookApi.create(form);
      setCreating(false);
      setForm({ url: '', secret: '', events: KNOWN_EVENTS.join(','), active: true });
      load();
    } catch (e) { alert(e.message); }
  }

  async function del(row) {
    if (!window.confirm(`Delete ${row.url}?`)) return;
    await webhookApi.remove(row.id);
    load();
  }

  async function test() {
    try {
      await webhookApi.test('test.event', { hello: 'from AI Governance ModelOps', ts: new Date().toISOString() });
      alert('Test event fired. Check the deliveries log below.');
      load();
    } catch (e) { alert(e.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Webhooks</h2>
          <p>HMAC-signed event delivery for incidents, evaluation failures, control test failures, AI alerts, and red-team findings.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!readOnly && <button className="btn btn-secondary" onClick={test}>Fire test event</button>}
          {!readOnly && <button className="btn" onClick={() => setCreating(true)}>+ New Webhook</button>}
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>ID</th><th>URL</th><th>Events</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {items.length === 0 && (<tr><td colSpan={5} style={{ padding: 20, color: '#94a3b8' }}>No webhooks.</td></tr>)}
            {items.map((w) => (
              <tr key={w.id}>
                <td>{w.webhook_id}</td>
                <td style={{ wordBreak: 'break-all' }}>{w.url}</td>
                <td>{w.events}</td>
                <td>{w.active ? 'yes' : 'no'}</td>
                <td>{!readOnly && <button className="btn btn-danger" onClick={() => del(w)}>Delete</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 24, color: '#f1f5f9' }}>Recent Deliveries</h3>
      <div className="table-wrap table-scroll">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Webhook</th><th>Event</th><th>Status</th><th>Response</th><th>Signature (hex)</th><th>When</th></tr></thead>
          <tbody>
            {deliveries.length === 0 && (<tr><td colSpan={7} style={{ padding: 20, color: '#94a3b8' }}>No deliveries yet.</td></tr>)}
            {deliveries.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.webhook_id}</td>
                <td>{d.event}</td>
                <td>{d.status_code}</td>
                <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.response}</td>
                <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace', fontSize: 11 }}>{d.signature}</td>
                <td>{new Date(d.delivered_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="modal-overlay" onClick={() => setCreating(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>New Webhook</h3><button className="modal-close" onClick={() => setCreating(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>URL</label>
                  <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/webhook" />
                </div>
                <div className="form-group">
                  <label>Secret (HMAC)</label>
                  <input value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="optional" />
                </div>
                <div className="form-group">
                  <label>Active</label>
                  <select value={form.active ? 'true' : 'false'} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}>
                    <option value="true">true</option><option value="false">false</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Events (comma separated; or * for all)</label>
                  <input value={form.events} onChange={(e) => setForm({ ...form, events: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn" onClick={save}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

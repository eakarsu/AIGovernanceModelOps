import React, { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3021/api';
function token() { try { return localStorage.getItem('token'); } catch (_) { return null; } }

const EMPTY = {
  rule_id: '',
  name: '',
  rule_type: 'approval_gate',
  trigger: 'deployment.requested',
  threshold: null,
  metric: '',
  required_approvers: [],
  severity: 'medium',
  action: 'notify_only',
  enabled: true,
  notes: '',
};

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
      ...(opts.headers || {}),
    },
  });
  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error((body && body.error) || `HTTP ${res.status}`);
  return body;
}

export default function PolicyRulesEditor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // rule object or null
  const [form, setForm] = useState(EMPTY);

  async function load() {
    setLoading(true); setError(null);
    try { setData(await api('/custom-views/policy-rules')); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing({ id: null });
    setForm({ ...EMPTY, rule_id: `RULE-${Date.now()}` });
  }
  function openEdit(r) {
    setEditing(r);
    setForm({
      ...r,
      required_approvers: Array.isArray(r.required_approvers) ? r.required_approvers : [],
      threshold: r.threshold ?? '',
    });
  }
  function close() { setEditing(null); setForm(EMPTY); }

  async function save() {
    try {
      const payload = {
        ...form,
        threshold: form.threshold === '' || form.threshold == null ? null : Number(form.threshold),
        required_approvers: typeof form.required_approvers === 'string'
          ? form.required_approvers.split(',').map((s) => s.trim()).filter(Boolean)
          : form.required_approvers,
        enabled: form.enabled === true || form.enabled === 'true',
      };
      if (editing && editing.id) {
        await api(`/custom-views/policy-rules/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/custom-views/policy-rules', { method: 'POST', body: JSON.stringify(payload) });
      }
      close(); load();
    } catch (e) { alert(e.message); }
  }

  async function remove(r) {
    if (!window.confirm(`Delete rule ${r.rule_id}?`)) return;
    try { await api(`/custom-views/policy-rules/${r.id}`, { method: 'DELETE' }); load(); }
    catch (e) { alert(e.message); }
  }

  async function toggle(r) {
    try {
      await api(`/custom-views/policy-rules/${r.id}`, { method: 'PUT', body: JSON.stringify({ enabled: !r.enabled }) });
      load();
    } catch (e) { alert(e.message); }
  }

  return (
    <div className="ai-section" data-testid="policy-rules-editor">
      <div className="ai-section-title">NON-VIZ · ML Policy Rules (Approval Gates / Retraining Thresholds)</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className="btn" onClick={openNew}>+ New Rule</button>
        <button className="btn btn-ghost" onClick={load}>Refresh</button>
      </div>

      {loading && <div style={{ color: '#94a3b8' }}>Loading rules…</div>}
      {error && <div className="ai-error" style={{ padding: 8 }}>Error: {error}</div>}

      {data && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8, fontSize: 12, color: '#94a3b8' }}>
            <span>Total: <strong style={{ color: '#f1f5f9' }}>{data.total}</strong></span>
            <span>Enabled: <strong style={{ color: '#86efac' }}>{data.enabled}</strong></span>
            {Object.entries(data.by_type).map(([k, v]) => (
              <span key={k}>{k.replace(/_/g, ' ')}: <strong style={{ color: '#f1f5f9' }}>{v}</strong></span>
            ))}
          </div>
          <div className="table-wrap table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Trigger</th>
                  <th>Threshold</th>
                  <th>Action</th>
                  <th>Severity</th>
                  <th>Enabled</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.rules.map((r) => (
                  <tr key={r.id}>
                    <td><code>{r.rule_id}</code></td>
                    <td>{r.name}</td>
                    <td>{r.rule_type}</td>
                    <td>{r.trigger}</td>
                    <td>{r.threshold == null ? '—' : `${r.threshold} ${r.metric || ''}`}</td>
                    <td>{r.action}</td>
                    <td><span className={`badge ${r.severity}`}>{r.severity}</span></td>
                    <td>{r.enabled ? 'yes' : 'no'}</td>
                    <td>
                      <button className="btn btn-ghost" style={{ marginRight: 4 }} onClick={() => toggle(r)}>
                        {r.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn btn-ghost" style={{ marginRight: 4 }} onClick={() => openEdit(r)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => remove(r)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing.id ? 'Edit Rule' : 'New Rule'}</h3>
              <button className="modal-close" onClick={close}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Rule ID</label>
                  <input value={form.rule_id} onChange={(e) => setForm({ ...form, rule_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Rule Type</label>
                  <select value={form.rule_type} onChange={(e) => setForm({ ...form, rule_type: e.target.value })}>
                    {(data?.rule_types || ['approval_gate', 'retraining_threshold', 'bias_threshold']).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Trigger</label>
                  <input value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Threshold</label>
                  <input type="number" step="0.001" value={form.threshold ?? ''} onChange={(e) => setForm({ ...form, threshold: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Metric</label>
                  <input value={form.metric || ''} onChange={(e) => setForm({ ...form, metric: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Action</label>
                  <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                    {(data?.actions || ['notify_only']).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Severity</label>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                    {(data?.severities || ['low', 'medium', 'high', 'critical']).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Required Approvers (comma-separated)</label>
                  <input
                    value={Array.isArray(form.required_approvers) ? form.required_approvers.join(', ') : form.required_approvers}
                    onChange={(e) => setForm({ ...form, required_approvers: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Enabled</label>
                  <select value={form.enabled ? 'true' : 'false'} onChange={(e) => setForm({ ...form, enabled: e.target.value === 'true' })}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </div>
                <div className="form-group full" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn" onClick={save}>{editing.id ? 'Save changes' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

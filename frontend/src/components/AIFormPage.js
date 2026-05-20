import React, { useEffect, useState } from 'react';
import AIResultDisplay from './AIResultDisplay';
import { aiHistory, aiSamples } from '../services/api';

// Generic form-driven AI assistant page.
// Props: title, description, fields, defaults, runner(payload) -> Promise<result>, featureKey
function AIFormPage({ title, description, fields, defaults, runner, featureKey }) {
  const [form, setForm] = useState({ ...(defaults || {}) });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyView, setHistoryView] = useState(null);
  const [samples, setSamples] = useState([]);
  const [samplesError, setSamplesError] = useState(null);

  // Fetch the 5 sample scenarios for this AI verb on mount.
  // featureKey uses underscores (e.g. 'score_risk'); the samples endpoint
  // is keyed by URL verb (e.g. 'score-risk'). Convert before requesting.
  useEffect(() => {
    if (!featureKey) return;
    const verb = String(featureKey).replace(/_/g, '-');
    let cancelled = false;
    aiSamples(verb)
      .then((r) => { if (!cancelled) setSamples((r && r.samples) || []); })
      .catch((e) => { if (!cancelled) setSamplesError(e.message); });
    return () => { cancelled = true; };
  }, [featureKey]);

  function setField(key, value) { setForm((p) => ({ ...p, [key]: value })); }

  function applySample(sample) {
    if (!sample || !sample.values) return;
    // Replace form state with the sample's values, preserving keys that
    // aren't part of the sample (so defaults stay for any missing field).
    setForm((prev) => ({ ...prev, ...sample.values }));
    setResult(null);
    setError(null);
  }

  async function handleRun() {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await runner(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function openHistory() {
    if (!featureKey) { alert('History not available for this page.'); return; }
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryView(null);
    try {
      const rows = await aiHistory(featureKey);
      setHistory(rows || []);
    } catch (e) {
      setHistoryError(e.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() { setHistoryOpen(false); setHistoryView(null); }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={openHistory}>History</button>
          <button className="btn" onClick={handleRun} disabled={loading}>
            {loading ? 'Running…' : 'Run AI Analysis'}
          </button>
        </div>
      </div>

      <div className="table-wrap ai-form-wrap" style={{ padding: 18 }}>
        {(samples.length > 0 || samplesError) && (
          <div className="ai-sample-bar" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Sample Fill — click to populate the form
            </div>
            {samplesError && (
              <div style={{ color: '#f87171', fontSize: 12 }}>Samples unavailable: {samplesError}</div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {samples.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: '6px 10px' }}
                  onClick={() => applySample(s)}
                  title={`Fill form with: ${s.label}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="form-grid">
          {fields.map((f) => (
            <div className="form-group" key={f.key} style={f.full ? { gridColumn: '1 / -1' } : {}}>
              <label>{f.label}</label>
              {renderField(f, form[f.key], (v) => setField(f.key, v))}
            </div>
          ))}
        </div>
      </div>

      <AIResultDisplay result={result} loading={loading} error={error} />

      {historyOpen && (
        <div className="modal-overlay" onClick={closeHistory}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900 }}>
            <div className="modal-header">
              <h3>{title} — Past Results</h3>
              <button className="modal-close" onClick={closeHistory}>×</button>
            </div>
            <div className="modal-body">
              {historyLoading && <div className="ai-loading">Loading history…</div>}
              {historyError && <div className="ai-error">{historyError}</div>}
              {!historyLoading && !historyError && history.length === 0 && (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>No past runs for this feature yet.</div>
              )}
              {!historyLoading && !historyError && history.length > 0 && !historyView && (
                <div className="table-wrap table-scroll">
                  <table className="data-table">
                    <thead><tr><th>ID</th><th>When</th><th>Model</th><th>Input snippet</th><th></th></tr></thead>
                    <tbody>
                      {history.map((row) => (
                        <tr key={row.id} className="clickable" onClick={() => setHistoryView(row)}>
                          <td>{row.id}</td>
                          <td>{new Date(row.created_at).toLocaleString()}</td>
                          <td>{row.model || '—'}</td>
                          <td style={{ color: '#94a3b8' }}>{snippet(row.input)}</td>
                          <td><button className="btn btn-ghost">View</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {historyView && (
                <div>
                  <button className="btn btn-ghost" onClick={() => setHistoryView(null)} style={{ marginBottom: 10 }}>← Back to list</button>
                  <div className="ai-section-title">Run #{historyView.id} · {new Date(historyView.created_at).toLocaleString()}</div>
                  <div className="ai-section-title" style={{ marginTop: 12 }}>Input</div>
                  <pre className="ai-pre">{JSON.stringify(historyView.input, null, 2)}</pre>
                  <div className="ai-section-title" style={{ marginTop: 12 }}>Output</div>
                  <AIResultDisplay result={historyView.output} loading={false} error={null} />
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={closeHistory}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function snippet(obj) {
  if (!obj) return '—';
  try {
    const s = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return s.length > 80 ? s.slice(0, 80) + '…' : s;
  } catch (_) { return '—'; }
}

function renderField(field, value, onChange) {
  const { type = 'text', options, placeholder } = field;
  if (type === 'select') {
    return (
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">— select —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (type === 'textarea') {
    return <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
  }
  if (type === 'number') {
    return <input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} placeholder={placeholder} />;
  }
  return <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

export default AIFormPage;

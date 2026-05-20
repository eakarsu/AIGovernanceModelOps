import React, { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3021/api';
function token() { try { return localStorage.getItem('token'); } catch (_) { return null; } }

const SEVERITY_BG = {
  ok: '#14532d',
  medium: '#854d0e',
  high: '#7f1d1d',
};
const SEVERITY_FG = {
  ok: '#bbf7d0',
  medium: '#fde68a',
  high: '#fecaca',
};

export default function BiasDetectionHeatmap() {
  const [model, setModel] = useState('credit-decisioning-v3');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/custom-views/bias-detection-heatmap?model=${encodeURIComponent(model)}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [model]);

  function cellFor(cohort, metric) {
    if (!data) return null;
    return data.cells.find((c) => c.cohort === cohort && c.metric === metric);
  }

  return (
    <div className="ai-section" data-testid="bias-heatmap">
      <div className="ai-section-title">VIZ · Bias Detection Heatmap (Cohort × Metric)</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          {['credit-decisioning-v3', 'internal-fraud-classifier', 'churn-propensity-xgb', 'customer-support-rag'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button className="btn btn-ghost" onClick={load}>Refresh</button>
      </div>

      {loading && <div style={{ color: '#94a3b8', padding: 8 }}>Loading bias matrix…</div>}
      {error && <div className="ai-error" style={{ padding: 8 }}>Error: {error}</div>}

      {data && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8, fontSize: 12, color: '#94a3b8' }}>
            <span>Total cells: <strong style={{ color: '#f1f5f9' }}>{data.summary.total_cells}</strong></span>
            <span>High: <strong style={{ color: '#fca5a5' }}>{data.summary.high}</strong></span>
            <span>Medium: <strong style={{ color: '#fde68a' }}>{data.summary.medium}</strong></span>
            <span>OK: <strong style={{ color: '#86efac' }}>{data.summary.ok}</strong></span>
          </div>
          <div style={{ background: '#0b1220', border: '1px solid #1e293b', borderRadius: 6, padding: 8, overflowX: 'auto' }}>
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 130 }}>Cohort \ Metric</th>
                  {data.metrics.map((m) => <th key={m} style={{ minWidth: 90 }}>{m.replace(/_/g, ' ')}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.cohorts.map((c) => (
                  <tr key={c}>
                    <td><strong>{c}</strong></td>
                    {data.metrics.map((m) => {
                      const cell = cellFor(c, m);
                      const bg = SEVERITY_BG[cell?.severity] || '#1e293b';
                      const fg = SEVERITY_FG[cell?.severity] || '#cbd5e1';
                      return (
                        <td key={m} style={{ background: bg, color: fg, textAlign: 'center' }} title={`${c} · ${m} · ${cell?.severity}`}>
                          {cell?.value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
            Legend: <span style={{ background: SEVERITY_BG.ok, color: SEVERITY_FG.ok, padding: '1px 6px', borderRadius: 3 }}>ok</span>{' '}
            <span style={{ background: SEVERITY_BG.medium, color: SEVERITY_FG.medium, padding: '1px 6px', borderRadius: 3 }}>medium</span>{' '}
            <span style={{ background: SEVERITY_BG.high, color: SEVERITY_FG.high, padding: '1px 6px', borderRadius: 3 }}>high</span>
          </div>
        </>
      )}
    </div>
  );
}

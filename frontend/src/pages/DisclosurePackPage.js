import React, { useState } from 'react';
import { disclosurePack, getToken } from '../services/api';

// Apply pass 7 — Regulator-ready disclosure-pack bundler UI
// Bundles model-card + SSP + DPIA + latest bias/drift AI results +
// evaluations + incidents + red-team findings into one JSON envelope
// (no zip/PDF lib — `no new deps` constraint).
export default function DisclosurePackPage() {
  const [modelId, setModelId] = useState('internal-fraud-classifier-v7');
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleBuild() {
    if (!modelId) return;
    setLoading(true);
    setError(null);
    setBundle(null);
    try {
      const b = await disclosurePack.getJson(modelId);
      setBundle(b);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadJson() {
    if (!bundle) return;
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disclosure-pack-${modelId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleDownloadText() {
    if (!modelId) return;
    try {
      const res = await fetch(disclosurePack.textUrl(modelId), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Text export failed');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `disclosure-pack-${modelId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { alert(e.message); }
  }

  const cs = bundle?.coverage_summary || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Regulator-ready Disclosure Pack</h2>
          <p>
            Bundles model-card, SSPs, DPIAs, latest bias and drift AI results, recent
            evaluations, open incidents, and red-team findings into a single JSON envelope
            (downloadable as JSON or plain text).
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={handleBuild} disabled={loading || !modelId}>
            {loading ? 'Building…' : 'Build Pack'}
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadJson} disabled={!bundle}>
            Download JSON
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadText} disabled={!modelId}>
            Download Text
          </button>
        </div>
      </div>

      <div className="table-wrap" style={{ padding: 18 }}>
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Model ID (matches `models.model_id` or referenced in cards/SSPs/DPIAs)</label>
            <input
              type="text"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="internal-fraud-classifier-v7"
            />
          </div>
        </div>
      </div>

      {error && <div className="ai-error" style={{ marginTop: 14 }}>{error}</div>}

      {bundle && (
        <div className="table-wrap" style={{ padding: 18, marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>Coverage Summary — {bundle.model_id}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {Object.entries(cs).map(([k, v]) => (
              <div key={k} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.replace(/_/g, ' ')}</div>
                <div style={{ fontSize: 18, marginTop: 4 }}>{String(v)}</div>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: 18 }}>Raw Bundle</h3>
          <pre className="ai-pre" style={{ maxHeight: 480, overflow: 'auto' }}>
            {JSON.stringify(bundle, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

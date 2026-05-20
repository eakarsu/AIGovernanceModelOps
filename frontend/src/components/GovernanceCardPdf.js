import React, { useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3021/api';
function token() { try { return localStorage.getItem('token'); } catch (_) { return null; } }

const DEFAULTS = {
  model: 'internal-fraud-classifier',
  owner: 'AI Risk Office',
  risk_tier: 'high-risk',
  framework: 'EU AI Act · NIST AI RMF · ISO 42001',
  intended_use: 'Detect fraudulent transactions in real time across EU markets.',
  limitations: 'Not validated for synthetic identity attack vectors; degraded on out-of-distribution merchants.',
  evaluations: 'AUC=0.943 (baseline), PSI=0.07 (last 30d), Disparate impact=0.91 across protected cohorts.',
  data_sources: 'Internal transaction ledger (2019–2025), labelled fraud cases curated by Risk Ops.',
};

export default function GovernanceCardPdf() {
  const [form, setForm] = useState(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [lastFile, setLastFile] = useState(null);

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function generate() {
    setBusy(true); setError(null); setLastFile(null);
    try {
      const res = await fetch(`${API_BASE}/custom-views/governance-card-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fname = `model-card-${form.model}-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setLastFile({ name: fname, size: blob.size });
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const fields = [
    ['model', 'Model', 'text'],
    ['owner', 'Owner', 'text'],
    ['risk_tier', 'Risk Tier', 'select', ['minimal', 'limited', 'high-risk', 'unacceptable']],
    ['framework', 'Frameworks', 'text'],
    ['intended_use', 'Intended Use', 'textarea'],
    ['limitations', 'Limitations', 'textarea'],
    ['evaluations', 'Evaluations Summary', 'textarea'],
    ['data_sources', 'Data Sources', 'textarea'],
  ];

  return (
    <div className="ai-section" data-testid="gov-card-pdf">
      <div className="ai-section-title">NON-VIZ · Governance / Model Card PDF</div>
      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {fields.map(([k, label, type, opts]) => (
          <div key={k} className={`form-group ${type === 'textarea' ? 'full' : ''}`} style={type === 'textarea' ? { gridColumn: '1 / -1' } : {}}>
            <label>{label}</label>
            {type === 'select' ? (
              <select value={form[k]} onChange={(e) => set(k, e.target.value)}>
                {opts.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : type === 'textarea' ? (
              <textarea value={form[k]} onChange={(e) => set(k, e.target.value)} rows={3} />
            ) : (
              <input type="text" value={form[k]} onChange={(e) => set(k, e.target.value)} />
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn" onClick={generate} disabled={busy}>
          {busy ? 'Generating…' : 'Generate & Download PDF'}
        </button>
        {lastFile && (
          <span style={{ color: '#86efac', fontSize: 12 }}>
            Downloaded {lastFile.name} ({lastFile.size} bytes)
          </span>
        )}
      </div>
      {error && <div className="ai-error" style={{ padding: 8, marginTop: 8 }}>Error: {error}</div>}
    </div>
  );
}

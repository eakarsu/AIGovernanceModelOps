import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3021/api';

function token() { try { return localStorage.getItem('token'); } catch (_) { return null; } }

export default function ModelDriftTrendChart() {
  const [model, setModel] = useState('internal-fraud-classifier');
  const [metric, setMetric] = useState('PSI');
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/custom-views/model-drift-trend?model=${encodeURIComponent(model)}&metric=${encodeURIComponent(metric)}&days=${days}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [model, metric, days]);

  const chart = useMemo(() => {
    if (!data || !data.points) return null;
    const w = 720;
    const h = 220;
    const padL = 50, padR = 20, padT = 20, padB = 30;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    const xs = data.points.map((_, i) => padL + (i * innerW) / Math.max(1, data.points.length - 1));
    const ys = data.points.map((p) => p.value);
    const maxY = Math.max(...ys, data.threshold) * 1.1;
    const minY = 0;
    const yScale = (v) => padT + innerH - ((v - minY) / (maxY - minY)) * innerH;
    const path = data.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${yScale(p.value).toFixed(1)}`).join(' ');
    const thrY = yScale(data.threshold);
    return { w, h, padL, padR, padT, padB, innerW, innerH, xs, ys, maxY, yScale, path, thrY };
  }, [data]);

  return (
    <div className="ai-section" data-testid="drift-chart">
      <div className="ai-section-title">VIZ · Model Drift Trend</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          {(data?.available_models || [model]).map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={metric} onChange={(e) => setMetric(e.target.value)}>
          {(data?.available_metrics || [metric]).map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[14, 30, 60, 90].map((d) => <option key={d} value={d}>{d} days</option>)}
        </select>
        <button className="btn btn-ghost" onClick={load}>Refresh</button>
      </div>

      {loading && <div style={{ color: '#94a3b8', padding: 8 }}>Loading drift series…</div>}
      {error && <div className="ai-error" style={{ padding: 8 }}>Error: {error}</div>}

      {data && chart && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8, fontSize: 12, color: '#94a3b8' }}>
            <span>Threshold: <strong style={{ color: '#fcd34d' }}>{data.threshold}</strong></span>
            <span>Latest: <strong style={{ color: '#f1f5f9' }}>{data.latest?.value}</strong></span>
            <span>Direction: <strong style={{ color: '#f1f5f9' }}>{data.direction}</strong></span>
            <span>Breached points: <strong style={{ color: data.breached_points > 0 ? '#fca5a5' : '#86efac' }}>{data.breached_points}</strong></span>
          </div>
          <div style={{ background: '#0b1220', border: '1px solid #1e293b', borderRadius: 6, padding: 8, overflowX: 'auto' }}>
            <svg width={chart.w} height={chart.h} role="img" aria-label="drift-trend-svg">
              <line x1={chart.padL} y1={chart.padT} x2={chart.padL} y2={chart.padT + chart.innerH} stroke="#334155" />
              <line x1={chart.padL} y1={chart.padT + chart.innerH} x2={chart.padL + chart.innerW} y2={chart.padT + chart.innerH} stroke="#334155" />
              <line x1={chart.padL} y1={chart.thrY} x2={chart.padL + chart.innerW} y2={chart.thrY} stroke="#fcd34d" strokeDasharray="4 4" />
              <text x={chart.padL + 4} y={chart.thrY - 4} fontSize="10" fill="#fcd34d">threshold {data.threshold}</text>
              <path d={chart.path} fill="none" stroke="#60a5fa" strokeWidth="2" />
              {data.points.map((p, i) => (
                <circle key={i} cx={chart.xs[i]} cy={chart.yScale(p.value)} r="2.5" fill="#60a5fa" />
              ))}
              {[0, Math.floor(data.points.length / 2), data.points.length - 1].map((i) => (
                <text key={i} x={chart.xs[i]} y={chart.padT + chart.innerH + 18} fontSize="10" fill="#94a3b8" textAnchor="middle">
                  {data.points[i].date.slice(5)}
                </text>
              ))}
              {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
                const v = chart.maxY * f;
                const y = chart.yScale(v);
                return (
                  <g key={i}>
                    <line x1={chart.padL - 4} y1={y} x2={chart.padL} y2={y} stroke="#475569" />
                    <text x={chart.padL - 6} y={y + 3} fontSize="10" fill="#64748b" textAnchor="end">{v.toFixed(2)}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </>
      )}
    </div>
  );
}

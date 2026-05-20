import React, { useEffect, useMemo, useRef, useState } from 'react';
import { attachments as attachmentsApi, isAuditor } from '../services/api';

// Generic CRUD page used by every registry/operations feature.
// Props:
//   title         – page title
//   description   – page subtitle
//   api           – { list, create, update, remove, bulkImportCsv } from services/api
//   columns       – [{ key, label, render? }] visible in the table
//   formFields    – [{ key, label, type, options?, placeholder?, full? }]
//   defaults      – default values for a new record
//   resourceKey   – optional logical resource name used for attachments
const PAGE_SIZE = 25;

function CrudPage({ title, description, api, columns, formFields, defaults, resourceKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(defaults || {});
  const [selected, setSelected] = useState(null);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCsv, setBulkCsv] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const fileInputRef = useRef(null);
  const readOnly = isAuditor();

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function load() {
    setLoading(true);
    setError(null);
    try { setItems(await api.list()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function openCreate() { setCreating(true); setEditing(null); setForm({ ...(defaults || {}) }); }
  function openEdit(row) { setEditing(row); setCreating(false); setForm({ ...row }); }
  function closeModal() { setCreating(false); setEditing(null); }

  async function handleSave() {
    try {
      if (editing) await api.update(editing.id, form);
      else await api.create(form);
      closeModal();
      load();
    } catch (e) { alert(e.message); }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Delete this ${title.slice(0, -1).toLowerCase()}?`)) return;
    try { await api.remove(row.id); if (selected?.id === row.id) setSelected(null); load(); }
    catch (e) { alert(e.message); }
  }

  function setField(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }

  // ---- Selection + attachments ----
  async function selectRow(row) {
    setSelected(row);
    if (!resourceKey) { setSelectedAttachments([]); return; }
    const idField = guessIdField(row);
    try {
      const list = await attachmentsApi.list(resourceKey, row[idField] || String(row.id));
      setSelectedAttachments(list);
    } catch (_) { setSelectedAttachments([]); }
  }

  async function handleUpload(file) {
    if (!file || !selected || !resourceKey) return;
    const idField = guessIdField(selected);
    try {
      await attachmentsApi.upload(file, resourceKey, selected[idField] || String(selected.id));
      const list = await attachmentsApi.list(resourceKey, selected[idField] || String(selected.id));
      setSelectedAttachments(list);
    } catch (e) { alert(e.message); }
  }

  async function handleAttachmentDelete(att) {
    if (!window.confirm(`Delete attachment ${att.filename}?`)) return;
    try {
      await attachmentsApi.remove(att.id);
      setSelectedAttachments((prev) => prev.filter((a) => a.id !== att.id));
    } catch (e) { alert(e.message); }
  }

  // ---- Search (text across all string fields) ----
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      Object.values(row).some((v) => {
        if (v == null) return false;
        if (typeof v === 'string' || typeof v === 'number') return String(v).toLowerCase().includes(q);
        return false;
      })
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, items.length]);

  function exportCsv() {
    const rows = filtered;
    if (!rows.length) { alert('No rows to export.'); return; }
    const headers = columns.map((c) => c.key);
    const escape = (v) => {
      if (v == null) return '';
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [headers.join(',')];
    for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(','));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function openBulkImport() {
    const headers = columns.map((c) => c.key).join(',');
    setBulkCsv(headers + '\n');
    setBulkResult(null);
    setBulkOpen(true);
  }

  async function handleBulkSubmit() {
    try {
      const result = await api.bulkImportCsv(bulkCsv);
      setBulkResult(result);
      load();
    } catch (e) { alert(e.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
          {readOnly && <p style={{ color: '#fcd34d' }}>Read-only mode (auditor role).</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={exportCsv}>Export CSV</button>
          {!readOnly && <button className="btn btn-secondary" onClick={openBulkImport}>Bulk Import CSV</button>}
          {!readOnly && <button className="btn" onClick={openCreate}>+ New {title.slice(0, -1)}</button>}
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="toolbar-count">
          {filtered.length === items.length
            ? `${items.length} total`
            : `${filtered.length} of ${items.length}`}
        </span>
      </div>

      {error && <div className="ai-error" style={{ padding: 12, marginBottom: 12 }}>Error: {error}</div>}

      <div className="table-wrap table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th style={{ width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td colSpan={columns.length + 1} style={{ padding: 20, color: '#94a3b8' }}>Loading…</td></tr>)}
            {!loading && !filtered.length && (<tr><td colSpan={columns.length + 1} style={{ padding: 20, color: '#94a3b8' }}>No records.</td></tr>)}
            {pageRows.map((row) => (
              <tr key={row.id} className="clickable" onClick={() => selectRow(row)}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row[c.key], row) : formatCell(row[c.key])}</td>
                ))}
                <td onClick={(e) => e.stopPropagation()}>
                  {!readOnly && <button className="btn btn-ghost" style={{ marginRight: 6 }} onClick={() => openEdit(row)}>Edit</button>}
                  {!readOnly && <button className="btn btn-danger" onClick={() => handleDelete(row)}>Delete</button>}
                  {readOnly && <button className="btn btn-ghost" onClick={() => selectRow(row)}>View</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="pagination">
          <button className="btn btn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>Prev</button>
          <span className="page-info">
            Page {safePage} of {totalPages} — showing {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <button className="btn btn-ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>Next</button>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Details</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-panel">
                {Object.entries(selected)
                  .filter(([k]) => !['created_at', 'updated_at', 'content'].includes(k))
                  .map(([k, v]) => (
                    <div className="field" key={k}>
                      <div className="label">{humanize(k)}</div>
                      <div className="value">{formatCell(v)}</div>
                    </div>
                  ))}
              </div>

              {resourceKey && (
                <div style={{ marginTop: 18 }}>
                  <div className="ai-section-title">Attachments / Evidence</div>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Filename</th><th>Type</th><th>Size</th><th>By</th><th></th></tr></thead>
                      <tbody>
                        {selectedAttachments.length === 0 && (
                          <tr><td colSpan={5} style={{ padding: 12, color: '#94a3b8' }}>No attachments yet.</td></tr>
                        )}
                        {selectedAttachments.map((a) => (
                          <tr key={a.id}>
                            <td>{a.filename}</td>
                            <td>{a.mime}</td>
                            <td>{a.size_bytes}</td>
                            <td>{a.uploaded_by || '—'}</td>
                            <td>
                              <a className="btn btn-ghost" href={attachmentsApi.downloadUrl(a.id)} target="_blank" rel="noopener noreferrer">Download</a>
                              {!readOnly && <button className="btn btn-danger" style={{ marginLeft: 6 }} onClick={() => handleAttachmentDelete(a)}>Delete</button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!readOnly && (
                    <div style={{ marginTop: 8 }}>
                      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={(e) => { handleUpload(e.target.files[0]); e.target.value = ''; }} />
                      <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>+ Upload Evidence</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-actions">
              {!readOnly && <button className="btn btn-secondary" onClick={() => { openEdit(selected); setSelected(null); }}>Edit</button>}
              <button className="btn" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {(creating || editing) && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit' : 'New'} {title.slice(0, -1)}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {formFields.map((f) => (
                  <div className={`form-group ${f.full ? 'full' : ''}`} key={f.key} style={f.full ? { gridColumn: '1 / -1' } : {}}>
                    <label>{f.label}</label>
                    {renderField(f, form[f.key], (v) => setField(f.key, v))}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn" onClick={handleSave}>{editing ? 'Save changes' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {bulkOpen && (
        <div className="modal-overlay" onClick={() => setBulkOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3>Bulk Import {title} (CSV)</h3>
              <button className="modal-close" onClick={() => setBulkOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>
                Paste CSV content. First row must be headers. Recognised columns: <code>{columns.map((c) => c.key).join(', ')}</code>.
              </div>
              <textarea
                value={bulkCsv}
                onChange={(e) => setBulkCsv(e.target.value)}
                style={{ width: '100%', minHeight: 220, background: '#0b1220', color: '#e2e8f0', border: '1px solid #1e293b', padding: 10, borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }}
              />
              {bulkResult && (
                <div className="ai-section" style={{ marginTop: 12 }}>
                  <div className="ai-section-title">Result</div>
                  <pre className="ai-pre">{JSON.stringify(bulkResult, null, 2)}</pre>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setBulkOpen(false)}>Close</button>
              <button className="btn" onClick={handleBulkSubmit}>Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function guessIdField(row) {
  // Prefer canonical id fields like *_id, fall back to numeric id
  const keys = Object.keys(row || {});
  return keys.find((k) => k.endsWith('_id') && k !== 'id') || 'id';
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
  if (type === 'checkbox') {
    return (
      <select value={value === true || value === 'true' ? 'true' : 'false'} onChange={(e) => onChange(e.target.value === 'true')}>
        <option value="false">false</option>
        <option value="true">true</option>
      </select>
    );
  }
  if (type === 'number') {
    return <input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} placeholder={placeholder} />;
  }
  return <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

function formatCell(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleDateString();
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function humanize(s) {
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default CrudPage;

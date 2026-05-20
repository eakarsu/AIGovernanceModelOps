import React, { useEffect, useState } from 'react';
import { notifications as notifApi } from '../services/api';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshCount();
    const t = setInterval(refreshCount, 30000);
    return () => clearInterval(t);
  }, []);

  async function refreshCount() {
    try { setCount((await notifApi.unread()).count || 0); }
    catch (_) { setCount(0); }
  }

  async function openPanel() {
    setOpen(true);
    setLoading(true);
    try { setItems(await notifApi.list()); }
    catch (_) { setItems([]); }
    finally { setLoading(false); }
  }

  async function markRead(id) {
    try { await notifApi.markRead(id); }
    catch (_) {}
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    refreshCount();
  }

  async function markAll() {
    try { await notifApi.markAllRead(); }
    catch (_) {}
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    refreshCount();
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-ghost" onClick={openPanel} style={{ width: '100%', marginBottom: 6 }}>
        Notifications {count > 0 && <span className="badge high" style={{ marginLeft: 6 }}>{count}</span>}
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Notifications</h3>
              <button className="modal-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {loading && <div className="ai-loading">Loading…</div>}
              {!loading && !items.length && <div style={{ color: '#94a3b8' }}>No notifications.</div>}
              {!loading && items.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div className="toolbar-count">{items.filter((n) => !n.read_at).length} unread</div>
                    <button className="btn btn-ghost" onClick={markAll}>Mark all read</button>
                  </div>
                  {items.map((n) => (
                    <div key={n.id} className="ai-card" style={{ borderLeft: n.read_at ? '3px solid #1e293b' : '3px solid #60a5fa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h5>{n.title || n.kind}</h5>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      {n.body && <p>{n.body}</p>}
                      <div style={{ marginTop: 6 }}>
                        <span className="ai-pill">{n.kind}</span>
                        {n.resource && <span className="ai-pill">{n.resource}{n.resource_id ? ` · ${n.resource_id}` : ''}</span>}
                        {!n.read_at && (
                          <button className="btn btn-ghost" style={{ float: 'right' }} onClick={() => markRead(n.id)}>Mark read</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

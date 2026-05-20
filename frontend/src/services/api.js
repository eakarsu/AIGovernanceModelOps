const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3021/api';

function getToken() {
  try { return localStorage.getItem('token'); } catch (_) { return null; }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  } catch (_) {}
}

function clearAuth() {
  setToken(null);
  try { localStorage.removeItem('user'); } catch (_) {}
}

async function request(url, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    clearAuth();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (body && body.error) || (typeof body === 'string' ? body : 'Request failed');
    throw new Error(msg);
  }
  return body;
}

// Auth
export const login = async (email, password) => {
  const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (data && data.token) {
    setToken(data.token);
    try { localStorage.setItem('user', JSON.stringify(data.user || {})); } catch (_) {}
  }
  return data;
};
export const logout = () => { clearAuth(); };
export const me = () => request('/auth/me');
export { getToken };

export function currentUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (_) { return null; }
}
export function isAuditor() {
  const u = currentUser();
  return u && u.role === 'auditor';
}

// Generic CRUD helpers
const crud = (path) => ({
  list:   () => request(path),
  get:    (id) => request(`${path}/${id}`),
  create: (data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`${path}/${id}`, { method: 'DELETE' }),
  bulkImportCsv: (csvString) => request(`${path}/bulk-import`, { method: 'POST', body: JSON.stringify({ csv: csvString }) }),
});

// Original 8
export const models       = crud('/models');
export const datasets     = crud('/datasets');
export const evaluations  = crud('/evaluations');
export const deployments  = crud('/deployments');
export const auditLogs    = crud('/audit-logs');
export const policies     = crud('/policies');
export const incidents    = crud('/incidents');
export const riskRegister = crud('/risk-register');

// New 10
export const modelCards       = crud('/model-cards');
export const prompts          = crud('/prompts');
export const ssp              = crud('/ssp');
export const dpiaRecords      = crud('/dpia-records');
export const redteamFindings  = crud('/redteam-findings');
export const thirdParties     = crud('/third-parties');
export const trainingRuns     = crud('/training-runs');
export const fineTunes        = crud('/fine-tunes');
export const controls         = crud('/controls');
export const jurisdictions    = crud('/jurisdictions');

export const getDashboard = () => request('/dashboard');

// Original 6 AI verbs
export const aiAuditBias      = (payload) => request('/ai/audit-bias',      { method: 'POST', body: JSON.stringify(payload) });
export const aiDetectDrift    = (payload) => request('/ai/detect-drift',    { method: 'POST', body: JSON.stringify(payload) });
export const aiMapCompliance  = (payload) => request('/ai/map-compliance',  { method: 'POST', body: JSON.stringify(payload) });
export const aiScoreRisk      = (payload) => request('/ai/score-risk',      { method: 'POST', body: JSON.stringify(payload) });
export const aiDraftPolicy    = (payload) => request('/ai/draft-policy',    { method: 'POST', body: JSON.stringify(payload) });
export const aiTriageIncident = (payload) => request('/ai/triage-incident', { method: 'POST', body: JSON.stringify(payload) });

// New 10 AI verbs
export const aiExplainDecision     = (p) => request('/ai/explain-decision',      { method: 'POST', body: JSON.stringify(p) });
export const aiPromptInjectionTest = (p) => request('/ai/prompt-injection-test', { method: 'POST', body: JSON.stringify(p) });
export const aiFairnessCurve       = (p) => request('/ai/fairness-curve',        { method: 'POST', body: JSON.stringify(p) });
export const aiDataLineage         = (p) => request('/ai/data-lineage',          { method: 'POST', body: JSON.stringify(p) });
export const aiModelCardGenerator  = (p) => request('/ai/model-card-generator',  { method: 'POST', body: JSON.stringify(p) });
export const aiThirdPartyAssess    = (p) => request('/ai/third-party-assess',    { method: 'POST', body: JSON.stringify(p) });
export const aiJailbreakTest       = (p) => request('/ai/jailbreak-test',        { method: 'POST', body: JSON.stringify(p) });
export const aiEnergyCost          = (p) => request('/ai/energy-cost',           { method: 'POST', body: JSON.stringify(p) });
export const aiControlMapper       = (p) => request('/ai/control-mapper',        { method: 'POST', body: JSON.stringify(p) });
export const aiSspDrafter          = (p) => request('/ai/ssp-drafter',           { method: 'POST', body: JSON.stringify(p) });

export const aiResults = () => request('/ai/results');
export const aiHistory = (feature) => request(`/ai/history?feature=${encodeURIComponent(feature)}`);
export const aiSamples = (feature) => request(`/ai/samples?feature=${encodeURIComponent(feature)}`);

// Notifications
export const notifications = {
  list:   () => request('/notifications'),
  unread: () => request('/notifications/unread-count'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
};

// Attachments
export const attachments = {
  list: (resource, resource_id) => {
    const qs = new URLSearchParams();
    if (resource) qs.set('resource', resource);
    if (resource_id) qs.set('resource_id', resource_id);
    return request(`/attachments${qs.toString() ? `?${qs}` : ''}`);
  },
  upload: async (file, resource, resource_id) => {
    const fd = new FormData();
    fd.append('file', file);
    if (resource) fd.append('resource', resource);
    if (resource_id) fd.append('resource_id', resource_id);
    const token = getToken();
    const res = await fetch(`${API_BASE}/attachments/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Upload failed');
    return res.json();
  },
  downloadUrl: (id) => `${API_BASE}/attachments/${id}/download`,
  remove: (id) => request(`/attachments/${id}`, { method: 'DELETE' }),
};

// Webhooks
export const webhooks = {
  list:    () => request('/webhooks'),
  create:  (data) => request('/webhooks', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id, data) => request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove:  (id) => request(`/webhooks/${id}`, { method: 'DELETE' }),
  test:    (event, payload) => request('/webhooks/test', { method: 'POST', body: JSON.stringify({ event, payload }) }),
  deliveries: () => request('/webhooks/deliveries'),
};

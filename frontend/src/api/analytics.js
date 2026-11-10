import api from './client';

export async function trackVisit(path) {
  if (localStorage.getItem('admin_token')) return;
  await api.post('/analytics', { path, ts: Date.now() }, { params: { type: 'track' } });
}

export async function trackEvent(type, payload = {}) {
  if (localStorage.getItem('admin_token')) return;
  const key = 'alebourg_session_id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(key, sessionId);
  }
  await api.post('/analytics', { type, payload, ts: Date.now(), sessionId }, { params: { type: 'event' } });
}

export async function obtenerMetricas(params) {
  const { data } = await api.get('/analytics', { params });
  return data;
}

// GymBro API client. One function per backend endpoint.
// Base URL from Vite env; JWT token persisted in localStorage.
// NOTE: this module is intentionally NOT wired into any screen yet.

// Un VITE_API_URL vacio significa "mismo dominio": las llamadas salen como
// /api/... y las enruta el ingress. Es lo que queremos cuando el frontend y
// el backend se despliegan juntos. Solo si la variable no esta definida se
// asume desarrollo local.
const RAW = import.meta.env.VITE_API_URL;
const BASE = RAW === undefined ? 'http://localhost:8001' : RAW;
const TOKEN_KEY = 'gb_token';

// Client ID publico de Google. Si esta vacio, la app oculta el boton en vez
// de mostrar uno que no puede funcionar.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = true, query } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
  }
  let url = `${BASE}/api${path}`;
  if (query) {
    const qs = new URLSearchParams(query).toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data && data.detail;
    throw new Error(typeof detail === 'string' ? detail : `HTTP ${res.status}`);
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────
export async function register(payload) {
  const data = await request('/auth/register', { method: 'POST', body: payload, auth: false });
  if (data && data.token) setToken(data.token);
  return data;
}
export async function login(email, password) {
  const data = await request('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  if (data && data.token) setToken(data.token);
  return data;
}
export function logout() {
  clearToken();
}
export async function googleAuth(credential) {
  const data = await request('/auth/google', { method: 'POST', body: { credential }, auth: false });
  if (data && data.token) setToken(data.token);
  return data;
}
export function forgotPassword(email) {
  return request('/auth/forgot-password', { method: 'POST', body: { email }, auth: false });
}
export async function resetPassword(token, password) {
  const data = await request('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false });
  if (data && data.token) setToken(data.token);
  return data;
}

// ── Profile ───────────────────────────────────────────
export function getMe() {
  return request('/me');
}
export function updateMe(patch) {
  return request('/me', { method: 'PATCH', body: patch });
}
export async function deleteMe() {
  const data = await request('/me', { method: 'DELETE' });
  clearToken();
  return data;
}

// ── Stats ─────────────────────────────────────────────
export function getStats() {
  return request('/stats');
}

// ── Taxonomy ──────────────────────────────────────────
export function getTaxonomy() {
  return request('/taxonomy', { auth: false });
}

// ── Sessions ──────────────────────────────────────────
export function getSessions(month) {
  return request('/sessions', { query: { month } });
}
export function getNextSession() {
  return request('/sessions/next');
}
export function createSession(muscles, { date, status } = {}) {
  const query = {};
  if (date) query.date = date;
  if (status) query.status = status;
  return request('/sessions', { method: 'POST', body: muscles, query });
}
export function updateSession(id, { muscles, status } = {}) {
  return request(`/sessions/${id}`, { method: 'PATCH', body: { muscles, status } });
}

// ── Conexiones ────────────────────────────────────────
export function searchUsers(q) {
  return request('/users/search', { query: { q } });
}
export function getConnections() {
  return request('/connections');
}
export function addConnection(username) {
  return request('/connections', { method: 'POST', body: { username } });
}
export function respondConnection(id, action) {
  return request(`/connections/${id}`, { method: 'PATCH', body: { action } });
}
export function removeConnection(id) {
  return request(`/connections/${id}`, { method: 'DELETE' });
}
export function getConnectionSession(id) {
  return request(`/connections/${id}/session`);
}

// ── Progress ──────────────────────────────────────────
export function getMuscleProgress(muscle) {
  return request('/progress/muscle', { query: { muscle } });
}
export function getExerciseProgress(exercise) {
  return request('/progress', { query: { exercise } });
}

export default {
  GOOGLE_CLIENT_ID,
  getToken, setToken, clearToken,
  register, login, logout, googleAuth, forgotPassword, resetPassword,
  getMe, updateMe, deleteMe,
  getStats,
  getTaxonomy,
  getSessions, getNextSession, createSession, updateSession,
  searchUsers, getConnections, addConnection, respondConnection,
  removeConnection, getConnectionSession,
  getMuscleProgress, getExerciseProgress,
};

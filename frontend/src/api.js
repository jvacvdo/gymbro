// GymBro API client. One function per backend endpoint.
// Base URL from Vite env; JWT token persisted in localStorage.
// NOTE: this module is intentionally NOT wired into any screen yet.

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const TOKEN_KEY = 'gb_token';

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

// ── Profile ───────────────────────────────────────────
export function getMe() {
  return request('/me');
}
export function updateMe(patch) {
  return request('/me', { method: 'PATCH', body: patch });
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

// ── Progress ──────────────────────────────────────────
export function getMuscleProgress(muscle) {
  return request('/progress/muscle', { query: { muscle } });
}
export function getExerciseProgress(exercise) {
  return request('/progress', { query: { exercise } });
}

export default {
  getToken, setToken, clearToken,
  register, login, logout,
  getMe, updateMe,
  getTaxonomy,
  getSessions, getNextSession, createSession, updateSession,
  getMuscleProgress, getExerciseProgress,
};

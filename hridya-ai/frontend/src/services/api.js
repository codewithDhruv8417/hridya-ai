/**
 * Single place where the React app talks to the FastAPI backend.
 *
 * Why a service module instead of fetch() inside components?
 *  - one base URL, one token, one error format;
 *  - components stay about UI, not HTTP;
 *  - changing where the API lives is a one-line edit.
 *
 * Override the URL with a VITE_API_BASE_URL entry in frontend/.env.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const TOKEN_KEY = 'hridya_token';

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

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the Hridaya API. Is the backend running on port 8000?', 0, null);
  }

  const text = await response.text();
  const payload = text ? safeJson(text) : null;

  if (!response.ok) {
    const detail = payload?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || d.detail).join(', ')
          : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  baseUrl: API_BASE_URL,

  health: () => request('/health', { auth: false }),

  // --- auth ---------------------------------------------------------------
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (identifier, password) =>
    request('/auth/login', { method: 'POST', body: { identifier, password }, auth: false }),
  me: () => request('/auth/me'),

  // --- screening ----------------------------------------------------------
  questionnaires: () => request('/questionnaires', { auth: false }),
  submitScreening: (payload) => request('/screening/submit', { method: 'POST', body: payload }),
  predict: (payload) => request('/prediction', { method: 'POST', body: payload }),
  history: () => request('/assessments'),

  // --- therapists ---------------------------------------------------------
  therapists: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ).toString();
    return request(`/therapists${query ? `?${query}` : ''}`, { auth: false });
  },
  specializations: () => request('/therapists/specializations', { auth: false }),

  // --- chat ---------------------------------------------------------------
  createChatSession: (session_title = 'Wellness check-in') =>
    request('/chat/sessions', { method: 'POST', body: { session_title } }),
  sendChatMessage: (sessionId, messageText, language = 'English') =>
    request(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: { message_text: messageText, language },
    }),
};

export default api;

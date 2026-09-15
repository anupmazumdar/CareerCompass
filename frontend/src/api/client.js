import { API_BASE_URL, AUTH_STORAGE_KEY } from '../config';

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Attach auth token if available
  const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  if (savedAuth) {
    try {
      const parsed = JSON.parse(savedAuth);
      const token = parsed.token || parsed.accessToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (_) {}
  }

  // Handle FormData (don't set Content-Type)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { success: false, error: raw?.slice(0, 200) || 'Server returned invalid response' };
  }

  if (!response.ok) {
    const error = new Error(data.message || data.error || `HTTP Error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' })
};

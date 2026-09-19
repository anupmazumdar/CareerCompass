import { API_BASE_URL } from '../config';
import { getStoredToken, setStoredToken, clearStoredAuth } from '../auth/AuthContext';

let refreshPromise = null;

async function executeTokenRefresh() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const url = `${API_BASE_URL}/api/auth/refresh`;
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && (data.accessToken || data.data?.accessToken)) {
        const newToken = data.accessToken || data.data.accessToken;
        setStoredToken(newToken);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('careercompass:auth:token-refreshed', { detail: { token: newToken } }));
        }
        return newToken;
      }
      throw new Error(data.message || 'Refresh token expired');
    } catch (err) {
      clearStoredAuth();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('careercompass:auth:logout'));
      }
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Attach auth token if available via unified AuthContext accessor
  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData (don't set Content-Type)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers
  });

  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { success: false, error: raw?.slice(0, 200) || 'Server returned invalid response' };
  }

  // Normalize data so it always returns the full envelope object
  if (typeof data !== 'object' || data === null) {
    data = { success: response.ok, data };
  } else if (data.success === undefined) {
    data.success = response.ok;
  }

  // Intercept 401 or 403 (TOKEN_EXPIRED / INVALID_TOKEN) and auto-refresh once
  const isAuthFailure = response.status === 401 || (response.status === 403 && (data?.error === 'TOKEN_EXPIRED' || data?.error === 'INVALID_TOKEN'));
  const isAuthEndpoint = endpoint.includes('/api/auth/login') || endpoint.includes('/api/auth/register') || endpoint.includes('/api/auth/refresh');

  if (isAuthFailure && !options._retry && !isAuthEndpoint) {
    try {
      const newToken = await executeTokenRefresh();
      if (newToken) {
        return await apiRequest(endpoint, {
          ...options,
          _retry: true,
          headers: {
            ...headers,
            'Authorization': `Bearer ${newToken}`
          }
        });
      }
    } catch (refreshErr) {
      // Refresh failed; propagate original error
    }
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

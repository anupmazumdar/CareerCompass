import { API_BASE_URL } from '../config';
import { getStoredToken } from '../auth/AuthContext';

/**
 * Backend Response Envelopes (Source of truth: backend/app/utils/response.js):
 *
 * 1. Standard Success:
 *    { success: true, message?: string, data: any }
 *
 * 2. List Routes:
 *    { success: true, count?: number, data: any[] }
 *
 * 3. Paginated Routes (e.g. GET /api/opportunities):
 *    { success: true, data: any[], total: number, totalPages: number, hasStudentProfile?: boolean }
 *
 * 4. Error Response:
 *    { success: false, error: string, errors?: any }
 */

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Attach auth token if available via unified AuthContext accessor
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

  // Normalize data so it always returns the full envelope object
  if (typeof data !== 'object' || data === null) {
    data = { success: response.ok, data };
  } else if (data.success === undefined) {
    data.success = response.ok;
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

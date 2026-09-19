import React, { createContext, useContext, useState, useEffect } from 'react';
import { AUTH_STORAGE_KEY } from '../config';

let inMemoryAccessToken = null;
let inMemoryUser = null;

export function getStoredAuth() {
  if (inMemoryAccessToken) {
    return { token: inMemoryAccessToken, user: inMemoryUser };
  }
  return null;
}

export function getStoredToken() {
  return inMemoryAccessToken;
}

export function getStoredUser() {
  return inMemoryUser;
}

export function clearStoredAuth() {
  inMemoryAccessToken = null;
  inMemoryUser = null;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (_) {}
}

export function setStoredAuth(userData) {
  const token = userData?.accessToken || userData?.token || inMemoryAccessToken;
  const user = userData?.user || userData;
  inMemoryAccessToken = token || null;
  inMemoryUser = user || null;
  // SECURITY: Never persist access token in browser localStorage or sessionStorage
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (_) {}
  return { isAuthenticated: Boolean(inMemoryAccessToken), user: inMemoryUser, token: inMemoryAccessToken };
}

export function setStoredToken(newToken) {
  inMemoryAccessToken = newToken || null;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // Purge any legacy localStorage auth tokens
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
        } catch (_) {}

        // 1. Transparently restore session from HttpOnly refresh cookie
        const { api } = await import('../api/client');
        const refreshRes = await api.post('/api/auth/refresh', {}, { _isInitialRefresh: true }).catch(() => null);

        const token = refreshRes?.accessToken || refreshRes?.data?.accessToken;
        if (token) {
          setStoredToken(token);

          // 2. Fetch fresh authenticated user profile from /api/auth/me
          const meRes = await api.get('/api/auth/me').catch(() => null);
          if (meRes && meRes.success && meRes.data) {
            const user = meRes.data;
            setStoredAuth({ user, accessToken: token });
            if (isMounted) {
              setAuthState({
                isAuthenticated: true,
                user,
                token
              });
            }
          } else {
            clearStoredAuth();
            if (isMounted) {
              setAuthState({ isAuthenticated: false, user: null, token: null });
            }
          }
        } else {
          clearStoredAuth();
          if (isMounted) {
            setAuthState({ isAuthenticated: false, user: null, token: null });
          }
        }
      } catch (err) {
        clearStoredAuth();
        if (isMounted) {
          setAuthState({ isAuthenticated: false, user: null, token: null });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    const handleLogoutEvent = () => {
      clearStoredAuth();
      if (isMounted) setAuthState({ isAuthenticated: false, user: null, token: null });
    };

    const handleTokenRefreshed = (e) => {
      if (isMounted && e.detail?.token) {
        setStoredToken(e.detail.token);
        setAuthState(prev => ({ ...prev, token: e.detail.token }));
      }
    };

    window.addEventListener('careercompass:auth:logout', handleLogoutEvent);
    window.addEventListener('careercompass:auth:token-refreshed', handleTokenRefreshed);

    return () => {
      isMounted = false;
      window.removeEventListener('careercompass:auth:logout', handleLogoutEvent);
      window.removeEventListener('careercompass:auth:token-refreshed', handleTokenRefreshed);
    };
  }, []);

  const login = (userData) => {
    const authPayload = setStoredAuth(userData);
    setAuthState(authPayload);
  };

  const logout = async () => {
    try {
      const { api } = await import('../api/client');
      await api.post('/api/auth/logout').catch(() => {});
    } catch (_) {}
    clearStoredAuth();
    setAuthState({ isAuthenticated: false, user: null, token: null });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('careercompass:auth:logout'));
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


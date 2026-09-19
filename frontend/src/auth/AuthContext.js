import React, { createContext, useContext, useState, useEffect } from 'react';
import { AUTH_STORAGE_KEY } from '../config';

export function getStoredAuth() {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const token = parsed?.token || parsed?.accessToken;
    const user = parsed?.user || parsed;
    if (token) return { token, user };
  } catch (_) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  return null;
}

export function getStoredToken() {
  const auth = getStoredAuth();
  return auth ? auth.token : null;
}

export function getStoredUser() {
  const auth = getStoredAuth();
  return auth ? auth.user : null;
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (_) {}
}

export function setStoredAuth(userData) {
  const token = userData?.accessToken || userData?.token;
  const user = userData?.user || userData;
  const authPayload = { isAuthenticated: Boolean(token), user, token };
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authPayload));
  } catch (_) {}
  return authPayload;
}

export function setStoredToken(newToken) {
  const auth = getStoredAuth();
  if (auth && newToken) {
    auth.token = newToken;
    setStoredAuth({ user: auth.user, accessToken: newToken });
  }
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
      const stored = getStoredAuth();
      if (!stored?.token) {
        if (isMounted) setLoading(false);
        return;
      }

      // Purge legacy mock/bogus tokens
      if (stored.token.startsWith('demo-') || !stored.token.includes('.')) {
        clearStoredAuth();
        if (isMounted) {
          setAuthState({ isAuthenticated: false, user: null, token: null });
          setLoading(false);
        }
        return;
      }

      // Fast optimistic restore from valid stored JWT
      if (isMounted) {
        setAuthState({
          isAuthenticated: true,
          user: stored.user,
          token: stored.token
        });
      }

      try {
        const { api } = await import('../api/client');
        const res = await api.get('/api/auth/me');
        if (res && res.success && res.data) {
          if (isMounted) {
            setAuthState({
              isAuthenticated: true,
              user: res.data,
              token: stored.token
            });
            // Update stored user profile with fresh server-grounded data
            setStoredAuth({ user: res.data, accessToken: stored.token });
          }
        }
      } catch (err) {
        // If 401/403 and refresh couldn't save session, clear stale state
        const status = err.status || err.data?.status;
        if (status === 401 || status === 403) {
          console.warn('Session expired on startup. Clearing stale credentials.');
          clearStoredAuth();
          if (isMounted) {
            setAuthState({ isAuthenticated: false, user: null, token: null });
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    const handleLogoutEvent = () => {
      if (isMounted) setAuthState({ isAuthenticated: false, user: null, token: null });
    };
    const handleTokenRefreshed = (e) => {
      if (isMounted && e.detail?.token) {
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

  const logout = () => {
    clearStoredAuth();
    setAuthState({ isAuthenticated: false, user: null, token: null });
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


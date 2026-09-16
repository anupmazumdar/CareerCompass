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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      setAuthState({
        isAuthenticated: true,
        user: stored.user,
        token: stored.token
      });
    }
    setLoading(false);
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


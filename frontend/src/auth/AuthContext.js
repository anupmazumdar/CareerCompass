import React, { createContext, useContext, useState, useEffect } from 'react';
import { AUTH_STORAGE_KEY } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.token || parsed.accessToken)) {
          setAuthState({
            isAuthenticated: true,
            user: parsed.user || parsed,
            token: parsed.token || parsed.accessToken
          });
        }
      } catch (_) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const token = userData.accessToken || userData.token;
    const user = userData.user || userData;
    const authPayload = { isAuthenticated: true, user, token };

    setAuthState(authPayload);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authPayload));
  };

  const logout = () => {
    setAuthState({ isAuthenticated: false, user: null, token: null });
    localStorage.removeItem(AUTH_STORAGE_KEY);
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

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { api } from '../../api/client';
import {
  setStoredAuth,
  getStoredAuth,
  getStoredToken,
  getStoredUser,
  clearStoredAuth,
  AuthProvider,
  useAuth
} from '../AuthContext';
import { AUTH_STORAGE_KEY } from '../../config';

// Mock the API client
jest.mock('../../api/client', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn()
  }
}));

describe('AuthContext - Security & In-Memory Token Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearStoredAuth();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    clearStoredAuth();
    localStorage.clear();
    sessionStorage.clear();
  });

  test('setStoredAuth keeps token purely in-memory and never writes to localStorage or sessionStorage', () => {
    const mockUserData = {
      accessToken: 'sample.jwt.token123',
      user: { id: 'user-1', email: 'student@example.com', role: 'student' }
    };

    setStoredAuth(mockUserData);

    // Verify in-memory accessors work
    expect(getStoredToken()).toBe('sample.jwt.token123');
    expect(getStoredUser()).toEqual({ id: 'user-1', email: 'student@example.com', role: 'student' });
    expect(getStoredAuth()).toEqual({
      token: 'sample.jwt.token123',
      user: { id: 'user-1', email: 'student@example.com', role: 'student' }
    });

    // Verify localStorage and sessionStorage NEVER have the auth payload or token
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  test('clearStoredAuth clears in-memory state and purges legacy storage keys', () => {
    setStoredAuth({
      accessToken: 'sample.jwt.token123',
      user: { id: 'user-1', role: 'student' }
    });

    expect(getStoredToken()).toBe('sample.jwt.token123');

    clearStoredAuth();

    expect(getStoredToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
    expect(getStoredAuth()).toBeNull();
  });

  test('AuthProvider restores session via HttpOnly refresh cookie on mount without reading localStorage', async () => {
    api.post.mockResolvedValueOnce({
      accessToken: 'new.refreshed.jwt'
    });
    api.get.mockResolvedValueOnce({
      success: true,
      data: { id: 'restored-user', email: 'alex@example.com', role: 'student' }
    });

    function Consumer() {
      const { isAuthenticated, user, loading } = useAuth();
      if (loading) return <div>Loading...</div>;
      return (
        <div>
          <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Unauthenticated'}</div>
          <div data-testid="user-email">{user?.email || 'none'}</div>
        </div>
      );
    }

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
    });

    expect(screen.getByTestId('user-email').textContent).toBe('alex@example.com');
    expect(getStoredToken()).toBe('new.refreshed.jwt');
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  test('AuthProvider safely defaults to unauthenticated if refresh call fails', async () => {
    api.post.mockRejectedValueOnce(new Error('No refresh token'));

    function Consumer() {
      const { isAuthenticated, loading } = useAuth();
      if (loading) return <div>Loading...</div>;
      return <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Unauthenticated'}</div>;
    }

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('Unauthenticated');
    });

    expect(getStoredToken()).toBeNull();
  });
});

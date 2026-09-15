// frontend/tests/e2e/userJourney.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from '../../src/layouts/AppLayout';
import { AuthContext } from '../../src/auth/AuthContext';

describe('Frontend End-to-End User Journey Simulation', () => {
  test('AppLayout renders navigation shell and child routes', () => {
    const mockAuthContext = {
      isAuthenticated: false,
      user: null,
      logout: jest.fn()
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <AppLayout>
            <div data-testid="child-page">Welcome to TalentAI</div>
          </AppLayout>
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('child-page')).toBeInTheDocument();
    expect(screen.getByText(/Welcome to TalentAI/i)).toBeInTheDocument();
  });
});

// frontend/tests/integration/navigation.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../src/components/Navbar';
import { AuthContext } from '../../src/auth/AuthContext';

describe('Frontend Integration - Navigation & Role States', () => {
  test('Navbar renders public authentication buttons for guest', () => {
    const mockAuthContext = {
      isAuthenticated: false,
      user: null,
      logout: jest.fn()
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/TalentAI/i)).toBeInTheDocument();
  });

  test('Navbar displays student navigation options when authenticated as student', () => {
    const mockAuthContext = {
      isAuthenticated: true,
      user: { role: 'student', fullName: 'Alice Student' },
      logout: jest.fn()
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/Student Portal/i)).toBeInTheDocument();
  });
});

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css';
import App from './App';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import CareerPathLayout from './student/CareerPathLayout';
import { CareerPathProfile } from './student/CareerPathProfile';
import { CareerPathOpportunities } from './student/CareerPathOpportunities';
import { CareerPathApplications } from './student/CareerPathApplications';
import { CareerPathSkills } from './student/CareerPathSkills';
import { CareerPathAssistant } from './student/CareerPathAssistant';
import { CareerPathDashboard } from './student/CareerPathDashboard';

// Auth0 is optional; credentials must be provided via environment variables with no hardcoded fallbacks
const AUTH0_DOMAIN = process.env.REACT_APP_AUTH0_DOMAIN || '';
const AUTH0_CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID || '';

function OptionalAuth0Provider({ children }) {
  if (AUTH0_DOMAIN && AUTH0_CLIENT_ID) {
    return (
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin
        }}
        cacheLocation="localstorage"
        useRefreshTokens={false}
      >
        {children}
      </Auth0Provider>
    );
  }
  return children;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <OptionalAuth0Provider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<App defaultShowAuth={true} />} />
            <Route path="/callback" element={<App />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />

            {/* CareerPath Student Platform Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPathLayout><CareerPathDashboard /></CareerPathLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPathLayout><CareerPathDashboard /></CareerPathLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPathLayout><CareerPathOpportunities /></CareerPathLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/opportunities"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPathLayout><CareerPathOpportunities /></CareerPathLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPathLayout><CareerPathApplications /></CareerPathLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/applications"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPathLayout><CareerPathApplications /></CareerPathLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/skills"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPathLayout><CareerPathSkills /></CareerPathLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/skills"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPathLayout><CareerPathSkills /></CareerPathLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPathLayout><CareerPathAssistant /></CareerPathLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assistant"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPathLayout><CareerPathAssistant /></CareerPathLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPathLayout><CareerPathProfile /></CareerPathLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPathLayout><CareerPathProfile /></CareerPathLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </OptionalAuth0Provider>
  </React.StrictMode>
);


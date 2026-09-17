import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
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
import CareerCompassLanding from './pages/CareerCompassLanding';
import StudentLogin from './pages/StudentLogin';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Authentication */}
          <Route path="/" element={<CareerCompassLanding />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Protected Student Platform Routes */}
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
  </React.StrictMode>
);

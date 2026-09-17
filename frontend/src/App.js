import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';

// Public Pages
import CareerCompassLanding from './pages/CareerCompassLanding';
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';

// Protected Student Platform Components
import CareerPathLayout from './student/CareerPathLayout';
import { CareerPathDashboard as StudentDashboard } from './student/CareerPathDashboard';
import { CareerPathProfile } from './student/CareerPathProfile';
import { CareerPathOpportunities } from './student/CareerPathOpportunities';
import { CareerPathApplications as ApplicationTracker } from './student/CareerPathApplications';
import { CareerPathSkills as SkillsManager } from './student/CareerPathSkills';
import { ResumeAnalyzer } from './student/ResumeAnalyzer';
import { CareerPathAssistant as AICareerChat } from './student/CareerPathAssistant';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<CareerCompassLanding />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/register" element={<StudentRegister />} />

          {/* Protected Student Platform Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <CareerPathLayout>
                  <StudentDashboard />
                </CareerPathLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <CareerPathLayout>
                  <CareerPathProfile />
                </CareerPathLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/opportunities"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <CareerPathLayout>
                  <CareerPathOpportunities />
                </CareerPathLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <CareerPathLayout>
                  <ApplicationTracker />
                </CareerPathLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <CareerPathLayout>
                  <SkillsManager />
                </CareerPathLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <CareerPathLayout>
                  <ResumeAnalyzer />
                </CareerPathLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-guidance"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <CareerPathLayout>
                  <AICareerChat />
                </CareerPathLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

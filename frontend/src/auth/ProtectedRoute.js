import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = String(user?.role || user?.userType || '').toLowerCase();
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to their respective role dashboard
    if (userRole === 'student') return <Navigate to="/student/dashboard" replace />;
    if (userRole === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />;
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

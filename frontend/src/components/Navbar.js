import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Briefcase, User, FileText, CheckCircle, LogOut, Sun, Moon, Shield } from 'lucide-react';

export function Navbar({ theme, toggleTheme }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const role = String(user?.role || user?.userType || '').toLowerCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Briefcase size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Talent<span className="text-indigo-400">AI</span>
          </span>
        </Link>

        {/* Navigation Links based on Role */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            {role === 'student' && (
              <>
                <Link to="/student/dashboard" className="hover:text-indigo-400 transition-colors">Dashboard</Link>
                <Link to="/student/jobs" className="hover:text-indigo-400 transition-colors">Recommended Jobs</Link>
                <Link to="/student/applications" className="hover:text-indigo-400 transition-colors">My Applications</Link>
                <Link to="/student/profile" className="hover:text-indigo-400 transition-colors">Profile & Skills</Link>
                <Link to="/student/resume" className="hover:text-indigo-400 transition-colors">Resume ATS</Link>
              </>
            )}

            {role === 'recruiter' && (
              <>
                <Link to="/recruiter/dashboard" className="hover:text-indigo-400 transition-colors">Dashboard</Link>
                <Link to="/recruiter/jobs/create" className="hover:text-indigo-400 transition-colors">Post Job</Link>
                <Link to="/recruiter/candidates" className="hover:text-indigo-400 transition-colors">Candidate Pipeline</Link>
                <Link to="/recruiter/company" className="hover:text-indigo-400 transition-colors">Company</Link>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link to="/admin/dashboard" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <Shield size={16} className="text-amber-400" /> TPO Admin
                </Link>
                <Link to="/admin/recruiters" className="hover:text-indigo-400 transition-colors">Recruiter Approvals</Link>
                <Link to="/admin/skills" className="hover:text-indigo-400 transition-colors">Skill Taxonomy</Link>
                <Link to="/admin/audit-logs" className="hover:text-indigo-400 transition-colors">Audit Logs</Link>
              </>
            )}
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-white">{user?.fullName || user?.name || user?.email}</p>
                <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">{role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

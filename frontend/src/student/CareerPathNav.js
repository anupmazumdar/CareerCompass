import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Briefcase,
  Layers,
  Sparkles,
  User,
  LogOut,
  GraduationCap,
  TrendingUp
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function CareerPathNav() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [student, setStudent] = useState(user);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await api.get('/api/students/me');
        if (res && res.success) {
          setStudent(res.data);
        }
      } catch (err) {
        console.warn('Failed to load user profile from API:', err.message);
        if (user) {
          setStudent(user);
        }
      }
    }
    loadUser();
  }, [user]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: TrendingUp },
    { label: 'Opportunities', path: '/opportunities', icon: Compass },
    { label: 'Applications', path: '/applications', icon: Layers },
    { label: 'Skills & Gaps', path: '/skills', icon: Briefcase },
    { label: 'AI Advisor', path: '/assistant', icon: Sparkles },
    { label: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link to="/opportunities" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition">
                <GraduationCap size={20} />
              </div>
              <div>
                <span className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                  Career<span className="text-indigo-600">Compass</span>
                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                    Student
                  </span>
                </span>
              </div>
            </Link>

            {/* Nav Tabs */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={15} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Action Profile & Logout */}
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                {student?.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {student?.full_name || 'Student'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {student?.headline ? student.headline.slice(0, 24) + '...' : 'MCA Cohort'}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 bg-slate-50/50">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-semibold ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default CareerPathNav;

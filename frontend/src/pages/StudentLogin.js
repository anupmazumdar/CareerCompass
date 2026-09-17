import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Sparkles, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';

export function StudentLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetRole, setTargetRole] = useState('Full-Stack Developer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? { email, password, role: 'student', full_name: fullName, targetRole }
        : { email, password };

      const res = await api.post(endpoint, payload);

      if (res && res.success && res.data) {
        login(res.data);
        navigate('/dashboard');
      } else {
        throw new Error(res?.message || res?.error || 'Authentication failed');
      }
    } catch (err) {
      // If backend is not running or returns error, provide clear feedback
      setError(err.message || 'Login failed. You can also use "Demo Student Access" below.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Instant zero-friction demo student session for evaluations
    const demoPayload = {
      token: 'demo-student-token-jwt-2026',
      user: {
        id: 1,
        email: 'student@careercompass.edu',
        role: 'student',
        full_name: 'Rahul Sharma',
        headline: 'MCA Final Year • Aspiring Full-Stack & Cloud Engineer',
        institution: 'University School of Information Technology',
        cgpa: '8.8',
        skills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'Python', 'TailwindCSS'],
        targetRole: 'Full-Stack Developer',
        profileCompleteness: 85
      }
    };
    login(demoPayload);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/30 text-white mb-4">
          <GraduationCap size={32} />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Career<span className="text-indigo-400">Compass</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Digital Career & Opportunity Platform for Students
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Quick Demo Access */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full mb-6 py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
          >
            <Sparkles size={16} />
            <span>1-Click Evaluator / Student Demo Login</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-3 text-slate-400 font-semibold tracking-wider">
                Or Sign In with Email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                    />
                    <User size={16} className="absolute right-3.5 top-3 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Target Placement Role
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Full-Stack Developer">Full-Stack Developer</option>
                    <option value="Backend Engineer">Backend Engineer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="AI / Data Engineer">AI / Data Engineer</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Student Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                />
                <Mail size={16} className="absolute right-3.5 top-3 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                />
                <Lock size={16} className="absolute right-3.5 top-3 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Create Student Account' : 'Sign In to Portal'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {isRegister
                ? 'Already have an account? Sign In'
                : "Don't have an account? Create Student Profile"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          CareerCompass Student Platform • Standalone MCA Placement System
        </p>
      </div>
    </div>
  );
}

export default StudentLogin;

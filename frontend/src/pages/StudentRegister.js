import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, ArrowRight, User, BookOpen, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';

export function StudentRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [gradYear, setGradYear] = useState('2026');
  const [targetRole, setTargetRole] = useState('Full-Stack Developer');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        email,
        password,
        role: 'student',
        full_name: fullName,
        college,
        graduation_year: Number(gradYear),
        targetRole
      };
      const res = await api.post('/api/auth/register', payload);
      if (res && res.success && res.data) {
        login(res.data);
        navigate('/dashboard');
      } else {
        throw new Error(res?.message || res?.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-indigo-800 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Career<span className="text-indigo-200">Compass</span>
          </span>
        </div>
        <div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Build your career profile.<br />Land your dream job.
          </h1>
          <p className="text-indigo-200 text-lg leading-relaxed mb-8">
            Create your free student profile and get matched with opportunities that fit your skills.
          </p>
          <div className="space-y-3">
            {[
              { emoji: '✅', text: 'Free for all students — no credit card required' },
              { emoji: '🚀', text: 'Profile setup in under 5 minutes' },
              { emoji: '🎯', text: 'Personalised job & internship matching' },
              { emoji: '📋', text: 'Track all your applications in one place' }
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-3 text-indigo-100 text-sm">
                <span>{emoji}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-300 text-xs">© 2025 CareerCompass · Built for students</p>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">
              Career<span className="text-indigo-600">Compass</span>
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1">Create your profile</h2>
          <p className="text-sm text-slate-500 mb-8">Join CareerCompass — it's completely free</p>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2.5">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <User size={15} className="absolute right-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">College / Institution</label>
              <div className="relative">
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="University School of Information Technology"
                  className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <BookOpen size={15} className="absolute right-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Graduation Year</label>
                <select
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  {['2025', '2026', '2027', '2028'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="Full-Stack Developer">Full-Stack Dev</option>
                  <option value="Backend Engineer">Backend Eng.</option>
                  <option value="Frontend Developer">Frontend Dev</option>
                  <option value="AI / Data Engineer">AI / Data Eng.</option>
                  <option value="DevOps Engineer">DevOps Eng.</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <Mail size={15} className="absolute right-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200/60 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Sign In →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentRegister;

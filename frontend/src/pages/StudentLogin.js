import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';

export function StudentLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res && res.success && res.data) {
        login(res.data);
        navigate('/dashboard');
      } else {
        throw new Error(res?.message || res?.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Try Demo Access below.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoPayload = {
      token: 'demo-student-token-jwt-2026',
      user: {
        id: 1,
        email: 'student@careercompass.edu',
        role: 'student',
        full_name: 'Rahul Sharma',
        headline: 'MCA Final Year · Aspiring Full-Stack Engineer',
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
    <div className="min-h-screen bg-slate-50 flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel - Branding */}
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
            Your career journey<br />starts here.
          </h1>
          <p className="text-indigo-200 text-lg leading-relaxed mb-8">
            Discover opportunities, track applications, and build skills that land you your dream job.
          </p>
          <div className="space-y-3">
            {[
              { emoji: '🎯', text: 'Smart opportunity matching by skill set' },
              { emoji: '📊', text: 'Visual application pipeline tracking' },
              { emoji: '🤖', text: 'AI-powered career guidance & resume tips' },
              { emoji: '📈', text: 'Skill gap analysis vs. target roles' }
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-3 text-indigo-100 text-sm">
                <span className="text-base">{emoji}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="text-indigo-300 text-xs">
          © 2025 CareerCompass · Built for students
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12">
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

          <h2 className="text-2xl font-black text-slate-900 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-8">Sign in to your student dashboard</p>

          {/* Demo Access */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full mb-6 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 hover:border-emerald-300 text-emerald-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-200"
          >
            <Sparkles size={16} className="text-emerald-600" />
            <span>Try Demo — 1-Click Student Access</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-50 px-3 text-slate-400 font-medium">or sign in with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            New student?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Create your profile →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;

import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Compass,
  Layers,
  Sparkles,
  ArrowRight,
  Target,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Star,
  Zap,
  Users,
  Brain,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const FEATURES = [
  {
    icon: Compass,
    color: 'indigo',
    title: 'Profile Builder',
    desc: 'Build a comprehensive student profile with education, skills, projects, and certifications — all in one place.'
  },
  {
    icon: Target,
    color: 'sky',
    title: 'Opportunity Discovery',
    desc: 'Browse curated jobs, internships, hackathons, and courses matched to your skill set with smart scoring.'
  },
  {
    icon: Layers,
    color: 'emerald',
    title: 'Application Tracker',
    desc: 'Visualise your entire application pipeline — from Saved to Offer — with a clean Kanban board.'
  },
  {
    icon: Sparkles,
    color: 'purple',
    title: 'Skills Manager',
    desc: 'Track your skills, run gap analysis against target roles, and find curated resources to level up fast.'
  }
];

const STEPS = [
  { icon: BookOpen, step: '01', title: 'Create your profile', desc: 'Add your education, skills, projects, and upload your resume to get started.' },
  { icon: Target,   step: '02', title: 'Discover opportunities', desc: 'Get matched with jobs and internships based on your profile and skill set.' },
  { icon: Layers,   step: '03', title: 'Track applications',   desc: 'Move applications through stages — Applied, Interview, Offer — on a visual board.' },
  { icon: TrendingUp, step: '04', title: 'Grow your skills',  desc: 'Identify skill gaps, follow curated learning paths, and get AI-powered career advice.' }
];

const STATS = [
  { value: '500+', label: 'Students Placed' },
  { value: '42+',  label: 'Curated Opportunities' },
  { value: '98%',  label: 'Profile Completion Rate' },
  { value: '4.9★', label: 'Student Satisfaction' }
];

const COLOR_MAP = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', hover: 'hover:border-indigo-300' },
  sky:    { bg: 'bg-sky-50',    text: 'text-sky-600',    border: 'border-sky-100',    hover: 'hover:border-sky-300'    },
  emerald:{ bg: 'bg-emerald-50',text: 'text-emerald-600',border: 'border-emerald-100',hover: 'hover:border-emerald-300' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', hover: 'hover:border-purple-300' }
};

export function CareerCompassLanding() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">
              Career<span className="text-indigo-600">Compass</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">
              Student
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition">How It Works</a>
            <a href="#stats" className="hover:text-indigo-600 transition">Stats</a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200/60 flex items-center gap-1.5 transition-all duration-200 active:scale-95"
            >
              Get Started
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-20 pb-28">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/60 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-100/50 rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/4" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 mb-6 shadow-sm">
            <Zap size={13} className="text-indigo-500" />
            <span>Digital Career Platform for Students · Batch 2025</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
            Discover.{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
              Apply.
            </span>
            {' '}Grow.
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-500 leading-relaxed mb-10">
            Your complete career platform — find opportunities, track applications, and build skills that matter.
            Built for students, by students.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-base shadow-xl shadow-indigo-200/70 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              <Star size={18} />
              Start for Free
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-base border border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-all duration-200 hover:border-indigo-300"
            >
              Sign In to Dashboard
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-500">
            <div className="flex -space-x-2">
              {['👩‍💻','👨‍🎓','👩‍🔬','👨‍💼','👩‍💼'].map((e, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-sm">{e}</div>
              ))}
            </div>
            <span><strong className="text-slate-700">500+</strong> students already using CareerCompass</span>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section id="stats" className="bg-indigo-600 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl font-black text-white">{value}</div>
                <div className="text-sm text-indigo-200 font-medium mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Everything you need to launch your career
            </h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              Four core modules designed to take you from student to professional — all in one dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              const c = COLOR_MAP[feat.color];
              return (
                <div
                  key={feat.title}
                  className={`bg-white rounded-2xl border ${c.border} ${c.hover} p-6 shadow-sm hover:shadow-md transition-all duration-200 group`}
                >
                  <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon size={24} className={c.text} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Your career journey in 4 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="absolute -top-3 left-6 bg-indigo-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-md">
                    {step.step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 mt-2">
                    <Icon size={20} className="text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AI FEATURE HIGHLIGHT ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-100 rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mb-4">
                <Brain size={12} />
                AI-Powered
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
                Your personal AI career advisor
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Get personalised career roadmaps, resume tips, and interview prep advice — grounded in your actual profile and skills, not generic templates.
              </p>
              <ul className="space-y-3">
                {[
                  'Resume analysis with actionable feedback',
                  'Skill gap identification vs. target roles',
                  'Mock interview questions by domain',
                  'Career path recommendations'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle size={16} className="text-indigo-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all duration-200 active:scale-95"
              >
                Try AI Advisor Free
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Mini AI chat preview */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">AI Career Advisor</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Online
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs flex-shrink-0">You</div>
                    <div className="bg-slate-50 rounded-xl rounded-tl-none p-2.5 text-xs text-slate-700 max-w-[85%]">
                      What skills should I learn for a backend role?
                    </div>
                  </div>
                  <div className="flex gap-2 flex-row-reverse">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={10} className="text-indigo-600" />
                    </div>
                    <div className="bg-indigo-50 rounded-xl rounded-tr-none p-2.5 text-xs text-indigo-900 max-w-[85%]">
                      Based on your profile, focus on: <strong>Node.js, PostgreSQL, Docker</strong>. You already have Python & REST APIs covered!
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Ask your advisor..."
                    className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    readOnly
                  />
                  <button className="p-2 bg-indigo-600 text-white rounded-lg">
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Ready to launch your career?
          </h2>
          <p className="text-indigo-200 text-lg mb-8">
            Join hundreds of students who are already using CareerCompass to land their dream internships and jobs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-indigo-700 font-bold rounded-2xl text-base shadow-xl flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              <Users size={18} />
              Create Free Account
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-2xl text-base border border-indigo-500 flex items-center justify-center gap-2 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <GraduationCap size={16} className="text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                Career<span className="text-indigo-600">Compass</span>
              </span>
              <span className="text-slate-400 text-xs ml-1">· Digital Career Platform for Students</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500">
              <a href="#features" className="hover:text-indigo-600 transition">Features</a>
              <a href="#how-it-works" className="hover:text-indigo-600 transition">How It Works</a>
              <Link to="/login" className="hover:text-indigo-600 transition">Login</Link>
              <Link to="/register" className="hover:text-indigo-600 transition">Register</Link>
            </div>

            <p className="text-xs text-slate-400">
              © 2025 CareerCompass. Built with ❤️ for students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CareerCompassLanding;

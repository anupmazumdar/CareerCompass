import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Compass,
  Layers,
  Sparkles,
      ArrowRight,
        Target,
      } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function CareerCompassLanding() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <GraduationCap size={22} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Career<span className="text-indigo-400">Compass</span>
              <span className="ml-2 text-[10px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Student Edition
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              Student Sign In
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <span>Launch Portal</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-indigo-500/30 text-xs font-semibold text-indigo-300 shadow-xl">
            <Sparkles size={14} className="text-indigo-400" />
            <span>Digital Career & Placement Platform for MCA Students</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Your Smart Compass from{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Graduation to Tech Careers
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            Personalized opportunity discovery, deterministic skill gap intelligence, interactive
            application Kanban tracking, and grounded AI career mentorship designed for computer application cohorts.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
            >
              <span>Get Started — Enter Student Portal</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={16} className="text-emerald-400" />
              <span>1-Click Evaluator Demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars */}
      <section className="py-16 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              End-to-End Student Career Journey
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Every phase from skill building to application tracking orchestrated under one roof.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Compass size={24} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">1. Opportunity Discovery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                42+ curated jobs, internships, hackathons & courses with deterministic 4-factor matching scores.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers size={24} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">2. Application Kanban</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visual 5-stage tracking (Saved, Applied, Interview, Offer, Rejected) with timeline logs & reminder alerts.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target size={24} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">3. Skill Gap Radar</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Benchmarked against 5 target placement tracks. Links directly to free curated video masterclasses.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles size={24} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">4. Grounded AI Advisor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                OpenRouter multi-model fallback chain grounded in your real profile for personalized career roadmaps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800 text-center text-xs text-slate-500">
        CareerCompass • Digital Career Platform for Students • Standalone MCA Placement Project
      </footer>
    </div>
  );
}

export default CareerCompassLanding;

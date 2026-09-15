import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Layers,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Building2,
  ChevronRight,
  MessageSquare,
  Award
} from 'lucide-react';
import { api } from '../api/client';

export function CareerPathDashboard() {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [meRes, appsRes, recsRes] = await Promise.all([
          api.get('/api/students/me').catch(() => ({ data: { data: null } })),
          api.get('/api/applications/my-applications').catch(() => ({ data: { data: [] } })),
          api.get('/api/opportunities?limit=3').catch(() => ({ data: { data: [] } }))
        ]);

        if (meRes.data?.data) {
          setProfile(meRes.data.data);
          // Load gap analysis for preferred role
          const roleKey = meRes.data.data.preferred_role?.toLowerCase().includes('backend')
            ? 'backend'
            : meRes.data.data.preferred_role?.toLowerCase().includes('front')
            ? 'frontend'
            : 'fullstack';
          const gapRes = await api.get(`/api/skills/gap-analysis?role=${roleKey}`).catch(() => null);
          if (gapRes?.data?.data) {
            setGapAnalysis(gapRes.data.data);
          }
        }

        if (appsRes.data?.data) {
          setApplications(appsRes.data.data);
        }

        if (recsRes.data?.data) {
          setRecommendations(recsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Compute Funnel Counts
  const funnel = {
    saved: applications.filter(a => a.status === 'saved').length,
    applied: applications.filter(a => a.status === 'applied').length,
    review: applications.filter(a => ['under_review', 'shortlisted'].includes(a.status)).length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'selected').length
  };

  const completeness = profile?.completeness_score || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-500">Assembling your placement analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
              <Sparkles size={13} className="text-indigo-600" />
              MCA Placement Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              {profile?.headline || 'Your profile is active and being benchmarked against top tech internships and full-time hiring pipelines.'}
            </p>
          </div>

          {/* Completeness Ring */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-2xs">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-600 transition-all duration-1000 ease-out"
                  strokeDasharray={`${completeness}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-extrabold text-slate-900">
                {completeness}%
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800">Profile Completeness</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {completeness >= 85 ? '🌟 Placement ready' : 'Add skills or projects to reach 100%'}
              </p>
              <Link to="/profile" className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 mt-1 inline-block">
                Edit Profile →
              </Link>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Briefcase size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
              <p className="text-xs text-slate-500 font-medium">Applications Tracked</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shrink-0">
              <MessageSquare size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{funnel.interview}</p>
              <p className="text-xs text-slate-500 font-medium">Interviews Scheduled</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-50 text-teal-600 shrink-0">
              <Award size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{(profile?.skills || []).length}</p>
              <p className="text-xs text-slate-500 font-medium">Verified Skills</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{gapAnalysis?.readinessScore || 75}%</p>
              <p className="text-xs text-slate-500 font-medium">Target Role Fit</p>
            </div>
          </div>
        </div>

        {/* Application Funnel Visualization */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Application Pipeline Funnel
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Conversion progress across your recruitment stages
              </p>
            </div>
            <Link to="/applications" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Kanban Board <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-sky-50/60 border border-sky-200/80 rounded-2xl p-4 text-center space-y-1">
              <span className="text-xs font-semibold text-sky-800 uppercase tracking-wide">📌 Wishlist</span>
              <p className="text-2xl font-black text-sky-900">{funnel.saved}</p>
              <span className="text-[10px] text-sky-700 font-medium">Saved to apply</span>
            </div>

            <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 text-center space-y-1">
              <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">📤 Applied</span>
              <p className="text-2xl font-black text-indigo-900">{funnel.applied}</p>
              <span className="text-[10px] text-indigo-700 font-medium">Initial submit</span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 text-center space-y-1">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">🔍 In Review</span>
              <p className="text-2xl font-black text-amber-900">{funnel.review}</p>
              <span className="text-[10px] text-amber-700 font-medium">Screening profile</span>
            </div>

            <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 text-center space-y-1">
              <span className="text-xs font-semibold text-purple-800 uppercase tracking-wide">🎙️ Interview</span>
              <p className="text-2xl font-black text-purple-900">{funnel.interview}</p>
              <span className="text-[10px] text-purple-700 font-medium">Technical & HR</span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-center space-y-1">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">🏆 Offers</span>
              <p className="text-2xl font-black text-emerald-900">{funnel.offer}</p>
              <span className="text-[10px] text-emerald-700 font-medium">Selected / Offers</span>
            </div>
          </div>
        </div>

        {/* Two Columns: Top Matched Opportunities & Fast-Track Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Columns: Recommended Openings */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                Recommended Openings For You
              </h3>
              <Link to="/opportunities" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {recommendations.slice(0, 3).map(job => (
                <div
                  key={job.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition truncate">
                      {job.title}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400" />
                      {job.company_name} • {job.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {job.match_score !== null && job.match_score !== undefined && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {Math.round(job.match_score)}% fit
                      </span>
                    )}
                    <Link
                      to="/opportunities"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-semibold transition shadow-2xs"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 5 Columns: Quick AI & Skills Hub */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" />
              Career Co-Pilot Hub
            </h3>

            <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Need Guidance?</h4>
                  <p className="text-xs text-slate-500">Ask CareerPath AI with grounded context</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Get targeted feedback on your project descriptions, learn how to bridge gaps for {gapAnalysis?.targetRole?.title || 'Full-Stack'} roles, and prep for technical rounds.
              </p>

              <div className="pt-1">
                <Link
                  to="/assistant"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs transition"
                >
                  Launch AI Career Advisor <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Gap Analysis Quick Link */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Skill Gap Diagnostics</p>
                <p className="text-[11px] text-slate-400">
                  {gapAnalysis ? `${gapAnalysis.missingCount} gaps identified for ${gapAnalysis.targetRole.title}` : 'Analyze competencies'}
                </p>
              </div>
              <Link
                to="/skills"
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 transition"
              >
                Inspect Gaps
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CareerPathDashboard;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Briefcase, FileText, CheckCircle, Clock, Award, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

export function StudentDashboard() {
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [recRes, appRes, profRes] = await Promise.all([
          api.get('/api/recommendations/jobs').catch(() => ({ success: false, data: [] })),
          api.get('/api/applications/my-applications').catch(() => ({ success: false, data: [] })),
          api.get('/api/students/me').catch(() => ({ success: false, data: null }))
        ]);

        if (recRes && recRes.success && recRes.data) setRecommendations((Array.isArray(recRes.data) ? recRes.data : recRes.data.data || []).slice(0, 5));
        if (appRes && appRes.success && appRes.data) setApplications((Array.isArray(appRes.data) ? appRes.data : appRes.data.data || []).slice(0, 5));
        if (profRes && profRes.success && profRes.data) setProfile(profRes.data?.data || profRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/20 p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Welcome back, {profile?.full_name || 'Student'}! 👋
        </h1>
        <p className="mt-2 text-sm md:text-base text-slate-300 max-w-2xl">
          {profile?.headline || 'Your AI-powered career co-pilot is actively analyzing campus openings and matching your skills with top tech jobs.'}
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400"><Briefcase size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{recommendations.length}</p>
              <p className="text-xs text-slate-400">Recommended Jobs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400"><CheckCircle size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{applications.length}</p>
              <p className="text-xs text-slate-400">Applications Submitted</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400"><Award size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{profile?.skills?.length || 0}</p>
              <p className="text-xs text-slate-400">Verified Skills</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400"><Sparkles size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">85%</p>
              <p className="text-xs text-slate-400">Average Match Fit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400" />
            Top AI-Recommended Jobs
          </h2>
          <Link to="/student/jobs" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View All Openings <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div key={rec.job.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white text-base">{rec.job.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{rec.job.company_name} • {rec.job.location}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                  {rec.matchScore}% Match
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-300 line-clamp-2">{rec.explanation}</p>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-xs font-medium text-slate-400">
                  {rec.matchedSkills?.length || 0} skills aligned
                </span>
                <Link
                  to={`/student/jobs`}
                  className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition"
                >
                  View & Apply
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

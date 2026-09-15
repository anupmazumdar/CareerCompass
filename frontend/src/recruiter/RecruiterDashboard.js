import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Briefcase, Users, CheckCircle, Plus, Eye, Clock } from 'lucide-react';

export function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [jobsRes, profRes] = await Promise.all([
          api.get('/api/recruiters/my-jobs').catch(() => ({ data: [] })),
          api.get('/api/recruiters/me').catch(() => ({ data: null }))
        ]);
        if (jobsRes.data) setJobs(jobsRes.data);
        if (profRes.data) setProfile(profRes.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const totalApplicants = jobs.reduce((sum, j) => sum + (Number(j.application_count) || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Recruiter Command Center</h1>
          <p className="mt-1 text-sm text-slate-400">
            {profile?.company_name || 'Enterprise Recruiter'} • Manage postings and review AI candidate rankings
          </p>
        </div>
        <Link
          to="/recruiter/jobs/create"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus size={18} /> Post New Job
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400"><Briefcase size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{jobs.length}</p>
              <p className="text-xs text-slate-400">Active Job Postings</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400"><Users size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{totalApplicants}</p>
              <p className="text-xs text-slate-400">Total Applicants</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400"><CheckCircle size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">Verified</p>
              <p className="text-xs text-slate-400">Company Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Postings Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Your Job Openings & Applicant Pools</h2>
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Job Title</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Applicants</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-medium text-white">{job.title}</td>
                  <td className="px-6 py-4 text-slate-400">{job.location}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400">
                      {job.application_count || 0} candidates
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/recruiter/jobs/${job.id}/candidates`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      <Eye size={14} /> Review Candidates
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

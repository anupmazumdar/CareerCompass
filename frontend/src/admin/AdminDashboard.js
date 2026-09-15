import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Shield, Users, Building, Briefcase, FileCheck, Check, X } from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [statsRes, recRes] = await Promise.all([
          api.get('/api/admin/stats').catch(() => ({ data: null })),
          api.get('/api/admin/recruiters').catch(() => ({ data: [] }))
        ]);
        if (statsRes.data) setStats(statsRes.data);
        if (recRes.data) setRecruiters(recRes.data);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const handleApprove = async (id, status) => {
    try {
      await api.patch(`/api/admin/recruiters/${id}/approve`, { status });
      setRecruiters(prev => prev.map(r => r.id === id ? { ...r, user_status: status } : r));
    } catch (err) {
      alert(`Approval action failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2.5">
          <Shield className="text-amber-400" /> TPO Admin & Placement Control Center
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Campus-wide recruitment metrics, recruiter authorization, and placement oversight
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400"><Users size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.totalStudents || 0}</p>
              <p className="text-xs text-slate-400">Enrolled Students</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400"><Building size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.totalCompanies || 0}</p>
              <p className="text-xs text-slate-400">Hiring Companies</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400"><Briefcase size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.totalJobs || 0}</p>
              <p className="text-xs text-slate-400">Campus Drives / Jobs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400"><FileCheck size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.totalApplications || 0}</p>
              <p className="text-xs text-slate-400">Total Applications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Approvals */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Recruiter Verification & Access Control</h2>
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Recruiter</th>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Account Status</th>
                <th className="px-6 py-3.5 text-right">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recruiters.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{r.full_name}</div>
                    <div className="text-xs text-slate-500">{r.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{r.company_name || 'Individual'}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r.user_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {r.user_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {r.user_status !== 'active' ? (
                      <button
                        onClick={() => handleApprove(r.id, 'active')}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                      >
                        <Check size={14} /> Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(r.id, 'disabled')}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-600/20 border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-600/30 transition"
                      >
                        <X size={14} /> Disable
                      </button>
                    )}
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

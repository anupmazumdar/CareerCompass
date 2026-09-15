import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Briefcase, MapPin, Search, CheckCircle, ArrowRight, X } from 'lucide-react';

export function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    async function loadJobs() {
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (locationFilter) queryParams.append('location', locationFilter);

        const res = await api.get(`/api/jobs?${queryParams.toString()}`);
        if (res.data) setJobs(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [search, locationFilter]);

  const handleApply = async () => {
    if (!selectedJob) return;
    setApplying(true);
    setApplyError('');
    try {
      await api.post('/api/applications', {
        jobId: selectedJob.id,
        coverNote
      });
      setAppliedSuccess(true);
      setTimeout(() => {
        setSelectedJob(null);
        setAppliedSuccess(false);
        setCoverNote('');
      }, 1500);
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Campus Tech Job Board</h1>
          <p className="text-sm text-slate-400">Discover and apply to verified developer opportunities aligned with your skills</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by role, company, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <MapPin size={18} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by location (e.g. Remote, Bangalore)..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-slate-800 bg-slate-900/20 text-slate-400">
          No job openings matched your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-base">{job.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{job.company_name} • {job.location}</p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300 font-medium">
                    {job.employment_type}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-300 line-clamp-3">{job.description}</p>

                {/* Skills Tags */}
                {job.skills && job.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 5).map((s) => (
                      <span
                        key={s.id}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          s.is_required
                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {s.canonical_name}
                      </span>
                    ))}
                    {job.skills.length > 5 && (
                      <span className="text-[10px] text-slate-500 py-0.5">+{job.skills.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400">
                  {job.min_salary && job.max_salary ? `₹${(job.min_salary / 100000).toFixed(1)}L - ₹${(job.max_salary / 100000).toFixed(1)}L` : 'Competitive'}
                </span>
                <button
                  onClick={() => setSelectedJob(job)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow transition"
                >
                  Apply Now <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Apply for {selectedJob.title}</h3>
                <p className="text-xs text-slate-400">{selectedJob.company_name}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {appliedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle size={48} className="mx-auto text-emerald-400 animate-bounce" />
                <p className="text-base font-bold text-white">Application Submitted!</p>
                <p className="text-xs text-slate-400">Your profile and skills have been matched and delivered to the recruiter.</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Short Note to Recruiter (Optional)</label>
                  <textarea
                    rows={4}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Highlight your relevant experience, projects, or why you are passionate about this role..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {applyError && <p className="text-xs text-red-400">{applyError}</p>}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={applying}
                    onClick={handleApply}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Briefcase,
  MapPin,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Check,
  AlertCircle,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../api/client';

export function CareerPathOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // 'internship', 'full-time', ''
  const [locationFilter, setLocationFilter] = useState('');
  const [minMatchFilter, setMinMatchFilter] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasStudentProfile, setHasStudentProfile] = useState(false);

  // Detail Modal / Match Breakdown State
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set());

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      if (locationFilter) params.append('location', locationFilter);
      if (minMatchFilter > 0) params.append('minMatch', minMatchFilter);
      params.append('page', page);
      params.append('limit', 9);

      const res = await api.get(`/api/opportunities?${params.toString()}`);
      if (res.data && res.data.success) {
        setOpportunities(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
        setHasStudentProfile(Boolean(res.data.hasStudentProfile));
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      showNotification('Failed to load career opportunities', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, locationFilter, minMatchFilter, page]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleOpenDetail = async (oppId) => {
    try {
      setDetailLoading(true);
      setSelectedOpportunity(null);
      const res = await api.get(`/api/opportunities/${oppId}`);
      if (res.data && res.data.success) {
        setSelectedOpportunity(res.data.data);
      }
    } catch (err) {
      showNotification('Unable to fetch opportunity breakdown', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApply = async (opportunity) => {
    try {
      // Create application in tracker
      await api.post('/api/applications', {
        opportunity_id: opportunity.id,
        job_id: opportunity.id,
        status: 'Applied',
        match_score: opportunity.match_score || 0
      });
      setAppliedJobs(prev => new Set([...prev, opportunity.id]));
      showNotification(`Successfully applied to ${opportunity.title} at ${opportunity.company_name}!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit application';
      showNotification(msg, 'error');
    }
  };

  const getMatchBadgeStyle = (score) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 65) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg text-sm font-medium border ${
          toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles size={15} />
                <span>AI-Powered Career Matching</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Discover Career Opportunities
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Explore curated tech internships and graduate roles matched against your verified skills, academic background, and project portfolio.
              </p>
            </div>

            {hasStudentProfile && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 text-xs text-indigo-800 font-semibold self-start md:self-center">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                Live Matching Active for Your Profile
              </div>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-5">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by role, skill (e.g. React, Python), or company..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Employment Type Pills */}
            <div className="md:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: '', label: 'All Types' },
                { id: 'internship', label: 'Internships' },
                { id: 'full-time', label: 'Full-Time' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTypeFilter(t.id); setPage(1); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    typeFilter === t.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Min Match Filter (For Students) */}
            <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-2">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <SlidersHorizontal size={13} />
                Min Match:
              </label>
              <select
                value={minMatchFilter}
                onChange={e => { setMinMatchFilter(Number(e.target.value)); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>All Matches</option>
                <option value={60}>60%+ Fit</option>
                <option value={75}>75%+ Strong Fit</option>
                <option value={85}>85%+ Top Match</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {opportunities.length} of {totalCount} Opportunities
          </p>
          {locationFilter && (
            <button
              onClick={() => setLocationFilter('')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Clear location filter
            </button>
          )}
        </div>

        {/* Opportunity Grid */}
        {loading ? (
          <div className="flex h-72 items-center justify-center bg-white rounded-2xl border border-slate-200">
            <div className="text-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">Calculating profile compatibility & opportunities...</p>
            </div>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <Briefcase size={40} className="mx-auto text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-900">No matching opportunities found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search keywords, lowering the minimum match threshold, or clearing the employment type filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map(opp => {
              const isApplied = appliedJobs.has(opp.id);
              const matchScore = opp.match_score !== undefined ? Math.round(opp.match_score) : null;
              const badgeStyle = matchScore !== null ? getMatchBadgeStyle(matchScore) : '';

              return (
                <div
                  key={opp.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-6 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Meta Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-xs font-bold text-indigo-600 tracking-wide uppercase">
                          {opp.company_name}
                        </span>
                        <h2 className="text-base font-bold text-slate-900 mt-0.5 leading-snug line-clamp-2">
                          {opp.title}
                        </h2>
                      </div>
                      
                      {/* Match Score Badge */}
                      {matchScore !== null && (
                        <div className={`px-2.5 py-1 rounded-xl border text-xs font-bold whitespace-nowrap flex items-center gap-1 ${badgeStyle}`}>
                          <Sparkles size={12} />
                          {matchScore}% Fit
                        </div>
                      )}
                    </div>

                    {/* Location & Employment Type */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" />
                        {opp.location}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                        {opp.employment_type}
                      </span>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                      {opp.description}
                    </p>

                    {/* Required Skills Chips */}
                    {opp.skills && opp.skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Required Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {opp.skills.slice(0, 4).map(s => {
                            const isMatched = (opp.matched_skills || []).includes(s.canonical_name);
                            return (
                              <span
                                key={s.canonical_name}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                                  isMatched
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {isMatched && <Check size={11} className="text-emerald-600" />}
                                {s.canonical_name}
                              </span>
                            );
                          })}
                          {opp.skills.length > 4 && (
                            <span className="text-[11px] font-semibold text-slate-400 self-center">
                              +{opp.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Action Row */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleOpenDetail(opp.id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition py-2"
                    >
                      View Breakdown <ArrowRight size={13} />
                    </button>

                    <button
                      onClick={() => handleApply(opp)}
                      disabled={isApplied}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isApplied
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 size={13} /> Applied
                        </>
                      ) : (
                        'Quick Apply'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Opportunity Detail & Match Breakdown Slide-Over / Modal */}
      {(selectedOpportunity || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            {detailLoading ? (
              <div className="py-16 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading opportunity details...</p>
              </div>
            ) : selectedOpportunity && (
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{selectedOpportunity.company_name}</span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">{selectedOpportunity.title}</h2>
                    <p className="text-xs text-slate-500 mt-1">{selectedOpportunity.location} • {selectedOpportunity.employment_type}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOpportunity(null)}
                    className="text-slate-400 hover:text-slate-700 p-2 rounded-lg text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Match Analysis Box */}
                {selectedOpportunity.match && (
                  <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900">Your AI Match Fit: {selectedOpportunity.match.final_score}%</h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                        Grade {selectedOpportunity.match.grade}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mb-4 leading-relaxed">
                      {selectedOpportunity.match.explanation}
                    </p>

                    {/* Breakdown Matrix */}
                    {selectedOpportunity.match.breakdown && (
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Skills</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedOpportunity.match.breakdown.skill_score}%</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Education</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedOpportunity.match.breakdown.education_score}%</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Projects</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedOpportunity.match.breakdown.project_score}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Job Description */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">About the Opportunity</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {selectedOpportunity.description}
                  </p>
                </div>

                {/* Skills Match Breakdown */}
                {selectedOpportunity.skills && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Skill Requirements</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedOpportunity.skills.map(s => {
                        const matched = (selectedOpportunity.match?.matched_skills || []).some(m => m.skill === s.canonical_name);
                        return (
                          <span
                            key={s.canonical_name}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                              matched
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {matched ? <Check size={12} className="text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                            {s.canonical_name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedOpportunity(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleApply(selectedOpportunity);
                      setSelectedOpportunity(null);
                    }}
                    disabled={appliedJobs.has(selectedOpportunity.id)}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                  >
                    {appliedJobs.has(selectedOpportunity.id) ? 'Already Applied' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

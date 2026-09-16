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
  Bookmark,
  Clock,
  FileText,
  DollarSign
} from 'lucide-react';
import { api } from '../api/client';

export function CareerPathOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [closingSoonList, setClosingSoonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // 'Internship', 'Job', ''
  const [workModeFilter, setWorkModeFilter] = useState(''); // 'remote', 'hybrid', 'onsite', ''
  const [locationFilter, setLocationFilter] = useState('');
  const [minMatchFilter, setMinMatchFilter] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'saved'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasStudentProfile, setHasStudentProfile] = useState(false);

  // Modals & Drawer States
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [applyModalOpp, setApplyModalOpp] = useState(null);
  const [applyCoverNote, setApplyCoverNote] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [primaryResume, setPrimaryResume] = useState(null);

  const [toast, setToast] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [savedJobs, setSavedJobs] = useState(new Set());

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Fetch Closing Soon Opportunities (Carousel)
  const fetchClosingSoon = useCallback(async () => {
    try {
      const res = await api.get('/api/opportunities/closing-soon?days=21&limit=6');
      if (res.data && res.data.success) {
        setClosingSoonList(res.data.data || []);
      }
    } catch (_) {}
  }, []);

  // 2. Fetch User Profile & Resumes (for quick apply)
  useEffect(() => {
    async function loadStudentData() {
      try {
        const [resumesRes, appsRes] = await Promise.all([
          api.get('/api/students/me/resumes').catch(() => ({ data: { data: [] } })),
          api.get('/api/applications/my-applications').catch(() => ({ data: { data: [] } }))
        ]);

        if (resumesRes.data && resumesRes.data.success && resumesRes.data.data) {
          const resumes = resumesRes.data.data;
          const primary = resumes.find(r => r.is_primary) || resumes[0] || null;
          setPrimaryResume(primary);
        }

        if (appsRes.data && appsRes.data.success && appsRes.data.data) {
          const applied = new Set(appsRes.data.data.map(a => a.opportunity_id || a.job_id).filter(Boolean));
          setAppliedJobs(applied);
        }
      } catch (_) {}
    }
    loadStudentData();
    fetchClosingSoon();
  }, [fetchClosingSoon]);

  // 3. Fetch Opportunities (Filtered / Paginated / Saved)
  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);

      if (activeTab === 'saved') {
        const res = await api.get('/api/opportunities/saved');
        if (res.data && res.data.success) {
          setOpportunities(res.data.data || []);
          setTotalCount(res.data.data.length);
          setTotalPages(1);
          setHasStudentProfile(true);
          const savedIds = new Set(res.data.data.map(o => o.id));
          setSavedJobs(savedIds);
        }
        return;
      }

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      if (workModeFilter) params.append('workMode', workModeFilter);
      if (locationFilter) params.append('location', locationFilter);
      if (minMatchFilter > 0) params.append('minMatch', minMatchFilter);
      params.append('page', page);
      params.append('limit', 9);

      const res = await api.get(`/api/opportunities?${params.toString()}`);
      if (res.data && res.data.success) {
        const items = res.data.data || [];
        setOpportunities(items);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
        setHasStudentProfile(Boolean(res.data.hasStudentProfile));

        const savedIds = new Set();
        items.forEach(opp => {
          if (opp.is_saved) savedIds.add(opp.id);
        });
        setSavedJobs(prev => new Set([...prev, ...savedIds]));
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      showNotification('Failed to load career opportunities', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, typeFilter, workModeFilter, locationFilter, minMatchFilter, page]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Toggle Bookmark / Save
  const handleToggleBookmark = async (e, oppId) => {
    e.stopPropagation();
    const isCurrentlySaved = savedJobs.has(oppId);

    // Optimistic update
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (isCurrentlySaved) next.delete(oppId);
      else next.add(oppId);
      return next;
    });

    try {
      if (isCurrentlySaved) {
        await api.delete(`/api/opportunities/${oppId}/save`);
        showNotification('Removed from saved wishlist');
      } else {
        await api.post(`/api/opportunities/${oppId}/save`);
        showNotification('Saved to your wishlist!');
      }

      if (activeTab === 'saved' && isCurrentlySaved) {
        setOpportunities(prev => prev.filter(o => o.id !== oppId));
      }
    } catch (err) {
      // Revert on failure
      setSavedJobs(prev => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.add(oppId);
        else next.delete(oppId);
        return next;
      });
      showNotification('Failed to update bookmark status', 'error');
    }
  };

  // Open Detail / Breakdown Modal
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

  // Submit Quick Apply
  const handleQuickApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyModalOpp) return;

    try {
      setSubmittingApply(true);
      await api.post('/api/applications', {
        opportunityId: applyModalOpp.id,
        coverNote: applyCoverNote || null,
        status: 'applied'
      });

      setAppliedJobs(prev => new Set([...prev, applyModalOpp.id]));
      showNotification(`Application submitted for ${applyModalOpp.title} at ${applyModalOpp.company || applyModalOpp.company_name}!`);
      setApplyModalOpp(null);
      setApplyCoverNote('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit application';
      showNotification(msg, 'error');
    } finally {
      setSubmittingApply(false);
    }
  };

  // Calculate Days Remaining until deadline
  const getDaysRemaining = (deadlineStr) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMatchBadgeStyle = (score) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 65) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg text-sm font-semibold border transition-all ${
          toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles size={15} />
                <span>Deterministic AI Career Matching Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Discover Career Opportunities
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Explore curated tech internships and entry-level SDE roles tailored to your verified MCA/CS skills, academic eligibility, and career preferences.
              </p>
            </div>

            {hasStudentProfile && (
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/80 rounded-2xl px-4 py-2.5 text-xs text-indigo-900 font-bold self-start md:self-center shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
                Live Matching Active (Skills 50% • Eligibility 20% • Preferences 20% • Completeness 10%)
              </div>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-3">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Role, company, skill..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Location Input */}
            <div className="relative md:col-span-2">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Location..."
                value={locationFilter}
                onChange={e => { setLocationFilter(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Role Type Filter */}
            <div className="md:col-span-3 flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: '', label: 'All Roles' },
                { id: 'Internship', label: 'Intern' },
                { id: 'Job', label: 'Full-Time' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTypeFilter(t.id); setPage(1); }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    typeFilter === t.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Work Mode Filter */}
            <div className="md:col-span-2">
              <select
                value={workModeFilter}
                onChange={e => { setWorkModeFilter(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Modes</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>

            {/* Min Match Filter */}
            <div className="md:col-span-2 flex items-center justify-start md:justify-end gap-1">
              <select
                value={minMatchFilter}
                onChange={e => { setMinMatchFilter(Number(e.target.value)); setPage(1); }}
                className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>Any Match %</option>
                <option value={60}>60%+ Fit</option>
                <option value={75}>75%+ Strong</option>
                <option value={85}>85%+ Top</option>
              </select>
            </div>
          </div>
        </div>

        {/* Closing Soon Carousel / Highlight Section */}
        {closingSoonList.length > 0 && activeTab === 'all' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <Clock size={16} />
                </span>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Closing Soon — Apply Before Deadline
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Opportunities closing within 21 days
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {closingSoonList.map(opp => {
                const daysLeft = getDaysRemaining(opp.deadline);
                const isApplied = appliedJobs.has(opp.id);
                const isSaved = savedJobs.has(opp.id);
                const matchScore = opp.match_score !== undefined ? Math.round(opp.match_score) : null;

                return (
                  <div
                    key={`closing-${opp.id}`}
                    className="bg-white rounded-2xl border border-amber-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock size={11} />
                          {daysLeft !== null && daysLeft <= 7
                            ? `⚡ Ends in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}!`
                            : `Closes in ${daysLeft} days`}
                        </span>

                        <button
                          onClick={(e) => handleToggleBookmark(e, opp.id)}
                          className={`p-1.5 rounded-lg transition ${
                            isSaved ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title={isSaved ? 'Remove Bookmark' : 'Bookmark Opportunity'}
                        >
                          <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-500">{opp.company || opp.company_name}</span>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">{opp.title}</h3>

                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {opp.location}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{opp.type || opp.employment_type}</span>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {matchScore !== null ? (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getMatchBadgeStyle(matchScore)}`}>
                          {matchScore}% Match
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Available</span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenDetail(opp.id)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => setApplyModalOpp(opp)}
                          disabled={isApplied}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            isApplied
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          }`}
                        >
                          {isApplied ? 'Applied' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Selection: All vs Saved Wishlist */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('all'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Briefcase size={14} />
              All Opportunities
            </button>
            <button
              onClick={() => { setActiveTab('saved'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Bookmark size={14} />
              Saved / Wishlist {savedJobs.size > 0 && `(${savedJobs.size})`}
            </button>
          </div>

          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {opportunities.length} {activeTab === 'saved' ? 'Saved' : `of ${totalCount}`} Roles
          </p>
        </div>

        {/* Opportunity Cards Grid */}
        {loading ? (
          <div className="flex h-72 items-center justify-center bg-white rounded-3xl border border-slate-200">
            <div className="text-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Calculating student profile compatibility & matching scores...</p>
            </div>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <Briefcase size={44} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-900">
              {activeTab === 'saved' ? 'No saved opportunities yet' : 'No matching opportunities found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'saved'
                ? 'Click the bookmark icon on any opportunity card to save it to your wishlist for later.'
                : 'Try adjusting your search keywords, lowering the minimum match threshold, or clearing your work mode filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map(opp => {
              const isApplied = appliedJobs.has(opp.id);
              const isSaved = savedJobs.has(opp.id);
              const matchScore = opp.match_score !== undefined ? Math.round(opp.match_score) : null;
              const badgeStyle = matchScore !== null ? getMatchBadgeStyle(matchScore) : '';
              const daysLeft = getDaysRemaining(opp.deadline);

              return (
                <div
                  key={opp.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all p-6 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Company, Bookmark Button & Match Pill */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-xs font-extrabold text-indigo-600 tracking-wide uppercase">
                          {opp.company || opp.company_name}
                        </span>
                        <h2 className="text-base font-bold text-slate-900 mt-0.5 leading-snug line-clamp-2">
                          {opp.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleToggleBookmark(e, opp.id)}
                          className={`p-2 rounded-xl transition ${
                            isSaved ? 'text-indigo-600 bg-indigo-50 border border-indigo-200' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title={isSaved ? 'Remove Bookmark' : 'Save to Wishlist'}
                        >
                          <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                        </button>

                        {matchScore !== null && (
                          <div
                            onClick={() => handleOpenDetail(opp.id)}
                            className={`px-2.5 py-1 rounded-xl border text-xs font-bold whitespace-nowrap flex items-center gap-1 cursor-pointer hover:opacity-90 transition ${badgeStyle}`}
                            title="Click to view 4-factor match score breakdown"
                          >
                            <Sparkles size={12} />
                            {matchScore}% Fit
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location, Work Mode & Salary / Stipend */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" />
                        {opp.location}
                      </span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                        {opp.work_mode || opp.work_type || 'hybrid'}
                      </span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold uppercase text-[10px]">
                        {opp.type || opp.employment_type}
                      </span>
                      {daysLeft !== null && daysLeft <= 21 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">
                          ⚡ {daysLeft}d left
                        </span>
                      )}
                    </div>

                    {/* Salary or Stipend */}
                    {(opp.stipend_range || opp.min_salary) && (
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-3">
                        <DollarSign size={13} className="text-emerald-600" />
                        <span>{opp.stipend_range || `₹${(opp.min_salary / 100000).toFixed(1)} - ₹${(opp.max_salary / 100000).toFixed(1)} LPA`}</span>
                      </div>
                    )}

                    {/* Description Snippet */}
                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                      {opp.description}
                    </p>

                    {/* Required Skills Chips */}
                    {opp.required_skills && opp.required_skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Required Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {opp.required_skills.slice(0, 4).map(skillName => {
                            const isMatched = (opp.match_breakdown?.matchedSkills || []).some(
                              m => m.toLowerCase() === String(skillName).toLowerCase()
                            );
                            return (
                              <span
                                key={skillName}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                                  isMatched
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {isMatched && <Check size={11} className="text-emerald-600" />}
                                {skillName}
                              </span>
                            );
                          })}
                          {opp.required_skills.length > 4 && (
                            <span className="text-[11px] font-semibold text-slate-400 self-center">
                              +{opp.required_skills.length - 4} more
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
                      onClick={() => setApplyModalOpp(opp)}
                      disabled={isApplied}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isApplied
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
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
        {totalPages > 1 && activeTab === 'all' && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-600">
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

      {/* Opportunity Detail & 4-Factor Match Breakdown Modal */}
      {(selectedOpportunity || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto font-sans">
            {detailLoading ? (
              <div className="py-16 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading opportunity breakdown...</p>
              </div>
            ) : selectedOpportunity && (
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
                      {selectedOpportunity.company || selectedOpportunity.company_name}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedOpportunity.title}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedOpportunity.location} • {selectedOpportunity.work_mode || selectedOpportunity.work_type} • {selectedOpportunity.type || selectedOpportunity.employment_type}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOpportunity(null)}
                    className="text-slate-400 hover:text-slate-700 p-2 rounded-lg text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* 4-Factor Deterministic Match Breakdown Card */}
                {selectedOpportunity.match_breakdown && (
                  <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-600" />
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Total Compatibility Score: {selectedOpportunity.match_score}%
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                        {selectedOpportunity.match_score >= 80 ? 'Top Fit' : selectedOpportunity.match_score >= 65 ? 'Good Fit' : 'Moderate Fit'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mb-4 leading-relaxed">
                      This score is computed deterministically using our 4-factor formula:
                      Skills Overlap (50%), Academic Eligibility (20%), Preference Alignment (20%), and Profile Completeness (10%).
                    </p>

                    {/* 4-Factor Breakdown Progress Bars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Skills (50%)</p>
                        <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                          {selectedOpportunity.match_breakdown.skillScore} / 50
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Eligibility (20%)</p>
                        <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                          {selectedOpportunity.match_breakdown.eligibilityScore} / 20
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Preference (20%)</p>
                        <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                          {selectedOpportunity.match_breakdown.preferenceScore} / 20
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Completeness (10%)</p>
                        <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                          {selectedOpportunity.match_breakdown.completenessScore} / 10
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Job Description */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Role Overview & Responsibilities</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {selectedOpportunity.description}
                  </p>
                </div>

                {/* Skills Analysis */}
                {selectedOpportunity.required_skills && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Required Skills Breakdown</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedOpportunity.required_skills.map(skillName => {
                        const matched = (selectedOpportunity.match_breakdown?.matchedSkills || []).some(
                          m => m.toLowerCase() === String(skillName).toLowerCase()
                        );
                        return (
                          <span
                            key={skillName}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                              matched
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {matched ? <Check size={12} className="text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                            {skillName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedOpportunity(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const opp = selectedOpportunity;
                      setSelectedOpportunity(null);
                      setApplyModalOpp(opp);
                    }}
                    disabled={appliedJobs.has(selectedOpportunity.id)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs transition ${
                      appliedJobs.has(selectedOpportunity.id)
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {appliedJobs.has(selectedOpportunity.id) ? 'Already Applied' : 'Quick Apply Now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Apply Confirmation Modal */}
      {applyModalOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7 font-sans">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
                  {applyModalOpp.company || applyModalOpp.company_name}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">Quick Apply: {applyModalOpp.title}</h3>
              </div>
              <button
                onClick={() => setApplyModalOpp(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickApplySubmit} className="space-y-4">
              {/* Primary Resume Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText size={18} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">
                    Primary Resume: {primaryResume ? primaryResume.file_name : 'Default Student Resume'}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Version: <span className="font-semibold text-indigo-600">{primaryResume ? primaryResume.version_label : 'v1'}</span> • Will be attached automatically
                  </p>
                </div>
              </div>

              {/* Cover Note Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Brief Introduction / Cover Note (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Highlight specific projects or skills relevant to this opportunity..."
                  value={applyCoverNote}
                  onChange={e => setApplyCoverNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApplyModalOpp(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  {submittingApply ? 'Submitting...' : 'Confirm & Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

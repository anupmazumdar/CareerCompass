import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Briefcase,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Columns,
  List,
  ChevronRight,
  MessageSquare,
  Trash2,
  Plus,
  Sparkles,
  MapPin,
  Bookmark,
  X
} from 'lucide-react';
import { api } from '../api/client';

const PIPELINE_COLUMNS = [
  {
    id: 'saved',
    title: 'Saved / Wishlist',
    icon: Bookmark,
    statuses: ['saved'],
    color: 'sky',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  {
    id: 'applied',
    title: 'Applied',
    icon: CheckCircle2,
    statuses: ['applied'],
    color: 'indigo',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    id: 'under_review',
    title: 'In Review / Screening',
    icon: Clock,
    statuses: ['under_review', 'shortlisted'],
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    id: 'interview',
    title: 'Interview Scheduled',
    icon: MessageSquare,
    statuses: ['interview'],
    color: 'purple',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    id: 'decision',
    title: 'Decisions',
    icon: Sparkles,
    statuses: ['selected', 'rejected', 'withdrawn'],
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
];

export function CareerPathApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail Modal State
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('timeline'); // 'timeline' | 'notes' | 'match'

  // Add Note State
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [noteReminderDate, setNoteReminderDate] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Apply from Saved State
  const [applyModalApp, setApplyModalApp] = useState(null);
  const [applyCoverNote, setApplyCoverNote] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);

  // Withdraw Modal State
  const [withdrawModalApp, setWithdrawModalApp] = useState(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch applications list
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/applications/my-applications');
      if (res.data && res.data.success) {
        setApplications(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
      showNotification('Failed to fetch applications', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Open detail modal with full history, notes, and match breakdown
  const openDetailModal = async (app) => {
    try {
      setDetailLoading(true);
      setSelectedApplication(app);
      setActiveDetailTab('timeline');
      const res = await api.get(`/api/applications/${app.id}`);
      if (res.data && res.data.success) {
        setSelectedApplication(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load application details:', err);
      showNotification('Failed to load full timeline and notes', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  // Add Note to current application
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedApplication) return;

    try {
      setSubmittingNote(true);
      const res = await api.post(`/api/applications/${selectedApplication.id}/notes`, {
        content: noteContent.trim(),
        noteType,
        reminderDate: noteReminderDate || null
      });

      if (res.data && res.data.success) {
        showNotification('Private note added successfully');
        setNoteContent('');
        setNoteReminderDate('');

        // Refresh notes list in modal
        setSelectedApplication(prev => ({
          ...prev,
          notes: [res.data.data, ...(prev.notes || [])],
          notes_count: (Number(prev.notes_count) || 0) + 1
        }));

        // Refresh main list notes count
        setApplications(prev =>
          prev.map(item =>
            item.id === selectedApplication.id
              ? { ...item, notes_count: (Number(item.notes_count) || 0) + 1 }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to add note:', err);
      showNotification(err.message || 'Failed to save note', 'error');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId) => {
    if (!selectedApplication) return;
    try {
      await api.delete(`/api/applications/${selectedApplication.id}/notes/${noteId}`);
      showNotification('Note deleted');
      setSelectedApplication(prev => ({
        ...prev,
        notes: prev.notes.filter(n => n.id !== noteId),
        notes_count: Math.max(0, (Number(prev.notes_count) || 1) - 1)
      }));
      setApplications(prev =>
        prev.map(item =>
          item.id === selectedApplication.id
            ? { ...item, notes_count: Math.max(0, (Number(item.notes_count) || 1) - 1) }
            : item
        )
      );
    } catch (err) {
      console.error('Failed to delete note:', err);
      showNotification('Failed to delete note', 'error');
    }
  };

  // Submit Application from Saved
  const handlePromoteToApplied = async () => {
    if (!applyModalApp) return;
    try {
      setSubmittingApply(true);
      const res = await api.post('/api/applications', {
        jobId: applyModalApp.job_id,
        status: 'applied',
        coverNote: applyCoverNote.trim() || null
      });

      if (res.data && res.data.success) {
        showNotification('Application submitted successfully! Tracking started.');
        setApplyModalApp(null);
        setApplyCoverNote('');
        if (selectedApplication?.id === applyModalApp.id) {
          setSelectedApplication(null);
        }
        await fetchApplications();
      }
    } catch (err) {
      console.error('Failed to submit application:', err);
      showNotification(err.message || 'Failed to submit application', 'error');
    } finally {
      setSubmittingApply(false);
    }
  };

  // Withdraw Application
  const handleWithdraw = async () => {
    if (!withdrawModalApp) return;
    try {
      setSubmittingWithdraw(true);
      const res = await api.patch(`/api/applications/${withdrawModalApp.id}/status`, {
        status: 'withdrawn',
        notes: withdrawReason.trim() || 'Withdrawn by student'
      });

      if (res.data && res.data.success) {
        showNotification('Application withdrawn');
        setWithdrawModalApp(null);
        setWithdrawReason('');
        if (selectedApplication?.id === withdrawModalApp.id) {
          setSelectedApplication(null);
        }
        await fetchApplications();
      }
    } catch (err) {
      console.error('Failed to withdraw application:', err);
      showNotification(err.message || 'Failed to withdraw', 'error');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // Remove from saved wishlist
  const handleRemoveSaved = async (appId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/api/applications/${appId}`);
      showNotification('Removed from saved wishlist');
      setApplications(prev => prev.filter(a => a.id !== appId));
      if (selectedApplication?.id === appId) {
        setSelectedApplication(null);
      }
    } catch (err) {
      console.error('Failed to remove saved opportunity:', err);
      showNotification('Failed to remove from wishlist', 'error');
    }
  };

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchSearch =
        !searchQuery ||
        app.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.job_location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ||
        app.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  // Metric counters
  const metrics = useMemo(() => {
    const total = applications.length;
    const active = applications.filter(a => ['applied', 'under_review', 'shortlisted', 'interview'].includes(a.status)).length;
    const interviews = applications.filter(a => a.status === 'interview').length;
    const offers = applications.filter(a => a.status === 'selected').length;
    return { total, active, interviews, offers };
  }, [applications]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'saved':
        return <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">📌 Saved</span>;
      case 'applied':
        return <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">📤 Applied</span>;
      case 'under_review':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">🔍 In Review</span>;
      case 'shortlisted':
        return <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200">⭐ Shortlisted</span>;
      case 'interview':
        return <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">🎙️ Interview</span>;
      case 'selected':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">🏆 Offer / Selected</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">❌ Not Selected</span>;
      case 'withdrawn':
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">⏸️ Withdrawn</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700 mb-2">
              <Sparkles size={13} className="text-indigo-600" />
              CareerPath Pipeline Manager
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Application Tracker
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track your student job applications end-to-end with immutable stage logs and private notes.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-center shadow-xs">
              <p className="text-xl font-bold text-slate-900">{metrics.total}</p>
              <p className="text-xs text-slate-500 font-medium">Total Tracked</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-center shadow-xs">
              <p className="text-xl font-bold text-indigo-600">{metrics.active}</p>
              <p className="text-xs text-slate-500 font-medium">In Pipeline</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-center shadow-xs">
              <p className="text-xl font-bold text-purple-600">{metrics.interviews}</p>
              <p className="text-xs text-slate-500 font-medium">Interviews</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-center shadow-xs">
              <p className="text-xl font-bold text-emerald-600">{metrics.offers}</p>
              <p className="text-xs text-slate-500 font-medium">Offers</p>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, View Switcher */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                placeholder="Filter by company, role, or location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Filter applications by status"
              className="px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-medium"
            >
              <option value="all">All Stages</option>
              <option value="saved">📌 Saved</option>
              <option value="applied">📤 Applied</option>
              <option value="under_review">🔍 In Review</option>
              <option value="shortlisted">⭐ Shortlisted</option>
              <option value="interview">🎙️ Interview</option>
              <option value="selected">🏆 Selected / Offer</option>
              <option value="rejected">❌ Rejected</option>
              <option value="withdrawn">⏸️ Withdrawn</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'kanban'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns size={15} />
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List size={15} />
                List View
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm font-medium text-slate-500">Loading your applications pipeline...</p>
          </div>
        ) : applications.length === 0 ? (
          /* Empty Pipeline State */
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 mb-4">
              <Briefcase size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Your application pipeline is empty</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              You haven't saved or applied to any jobs yet. Discover top campus roles with automated match analysis!
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <a
                href="/opportunities"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-xs transition"
              >
                <Sparkles size={16} />
                Explore Opportunities
              </a>
            </div>
          </div>
        ) : viewMode === 'kanban' ? (
          /* ==================== KANBAN BOARD VIEW ==================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
            {PIPELINE_COLUMNS.map(col => {
              const colApps = filteredApplications.filter(app => col.statuses.includes(app.status));
              const ColIcon = col.icon;

              return (
                <div key={col.id} className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 space-y-3 flex flex-col min-h-[480px]">
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1.5 pt-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${col.badgeClass}`}>
                        <ColIcon size={14} />
                      </div>
                      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {col.title}
                      </h2>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs">
                      {colApps.length}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="space-y-2.5 flex-1">
                    {colApps.length === 0 ? (
                      <div className="border border-dashed border-slate-300/80 rounded-xl p-4 text-center text-xs text-slate-400">
                        No applications in this stage
                      </div>
                    ) : (
                      colApps.map(app => (
                        <div
                          key={app.id}
                          onClick={() => openDetailModal(app)}
                          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition truncate">
                                {app.job_title}
                              </h3>
                              <p className="text-xs font-medium text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <Building2 size={12} className="text-slate-400" />
                                {app.company_name}
                              </p>
                            </div>

                            {app.match_score !== null && app.match_score !== undefined && (
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                                  app.match_score >= 75
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : app.match_score >= 50
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {Math.round(app.match_score)}% fit
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin size={11} /> {app.job_location}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{app.employment_type || 'Full-time'}</span>
                          </div>

                          {/* Footer Info & Quick Actions */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {new Date(app.applied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>

                            <div className="flex items-center gap-2">
                              {Number(app.notes_count) > 0 && (
                                <span className="flex items-center gap-1 text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                  <MessageSquare size={10} /> {app.notes_count}
                                </span>
                              )}

                              {app.status === 'saved' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setApplyModalApp(app);
                                  }}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition"
                                >
                                  Apply Now
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ==================== LIST / TABLE VIEW ==================== */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Opportunity</th>
                    <th className="px-6 py-3.5">Company</th>
                    <th className="px-6 py-3.5">Match Fit</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Applied Date</th>
                    <th className="px-6 py-3.5">Notes</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {filteredApplications.map(app => (
                    <tr
                      key={app.id}
                      onClick={() => openDetailModal(app)}
                      className="hover:bg-slate-50/70 transition cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900 group-hover:text-indigo-600">
                        {app.job_title}
                        <div className="text-xs text-slate-400 font-normal mt-0.5">
                          {app.job_location} • {app.employment_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {app.company_name}
                      </td>
                      <td className="px-6 py-4">
                        {app.match_score !== null && app.match_score !== undefined ? (
                          <span
                            className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md border ${
                              app.match_score >= 75
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : app.match_score >= 50
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {Math.round(app.match_score)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(app.applied_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {Number(app.notes_count) > 0 ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <MessageSquare size={13} className="text-indigo-500" />
                            {app.notes_count} note{Number(app.notes_count) > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          {app.status === 'saved' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setApplyModalApp(app)}
                                className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                              >
                                Apply
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleRemoveSaved(app.id, e)}
                                title="Remove from wishlist"
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openDetailModal(app)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                              Details <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== DETAIL DRAWER / MODAL ==================== */}
        {selectedApplication && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(selectedApplication.status)}
                    {selectedApplication.match_score !== null && selectedApplication.match_score !== undefined && (
                      <span className="text-xs font-bold text-slate-600">
                        • {Math.round(selectedApplication.match_score)}% Profile Match
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedApplication.job_title}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <Building2 size={14} className="text-slate-400" />
                    {selectedApplication.company_name}
                    <span className="text-slate-300">•</span>
                    <MapPin size={14} className="text-slate-400" />
                    {selectedApplication.job_location}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedApplication(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Nav Tabs */}
              <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('timeline')}
                  className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
                    activeDetailTab === 'timeline'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock size={15} />
                  Status Journey & Audit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('notes')}
                  className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
                    activeDetailTab === 'notes'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare size={15} />
                  Private Notes & Reminders ({selectedApplication.notes?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('match')}
                  className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
                    activeDetailTab === 'match'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles size={15} />
                  Match Breakdown
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : activeDetailTab === 'timeline' ? (
                  /* ==================== TAB 1: STATUS JOURNEY TIMELINE ==================== */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Application Progression</h3>
                      <span className="text-xs text-slate-400">Immutable audit log</span>
                    </div>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {(selectedApplication.history || []).map((step, idx) => (
                        <div key={step.id || idx} className="relative group">
                          <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          </div>

                          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                {step.previous_status === 'none' ? 'Initiated' : `${step.previous_status} → ${step.new_status}`}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(step.created_at).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {step.notes || `Status changed to ${step.new_status}`}
                            </p>
                            {step.changed_by_name && (
                              <p className="text-[10px] text-slate-400 pt-1">
                                Action recorded by: {step.changed_by_name} ({step.changed_by_role})
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedApplication.cover_note && (
                      <div className="mt-6 pt-4 border-t border-slate-200">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Submitted Cover Note</h4>
                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic border border-slate-200/60">
                          "{selectedApplication.cover_note}"
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeDetailTab === 'notes' ? (
                  /* ==================== TAB 2: PRIVATE NOTES & REMINDERS ==================== */
                  <div className="space-y-6">
                    {/* Add Note Form */}
                    <form onSubmit={handleAddNote} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Private Note or Follow-Up</h4>
                      <div>
                        <textarea
                          rows={2}
                          required
                          placeholder="e.g., Round 1 technical interview scheduled with lead engineer. Prepare concurrency and SQL questions."
                          value={noteContent}
                          onChange={e => setNoteContent(e.target.value)}
                          className="w-full p-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={noteType}
                            onChange={e => setNoteType(e.target.value)}
                            aria-label="Select note category"
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
                          >
                            <option value="general">📝 General</option>
                            <option value="interview_prep">💡 Interview Prep</option>
                            <option value="follow_up">⏰ Follow Up</option>
                            <option value="offer_details">🎉 Offer Details</option>
                          </select>

                          <input
                            type="date"
                            value={noteReminderDate}
                            onChange={e => setNoteReminderDate(e.target.value)}
                            title="Optional reminder date"
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingNote || !noteContent.trim()}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-2xs"
                        >
                          <Plus size={14} />
                          {submittingNote ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </form>

                    {/* Existing Notes List */}
                    <div className="space-y-3">
                      {(selectedApplication.notes || []).length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-6">
                          No private notes saved yet. Add your prep thoughts, questions, or follow-up dates above!
                        </p>
                      ) : (
                        selectedApplication.notes.map(note => (
                          <div key={note.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                                {note.note_type.replace('_', ' ')}
                              </span>
                              <div className="flex items-center gap-2">
                                {note.reminder_date && (
                                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                    <Clock size={11} />
                                    Reminder: {new Date(note.reminder_date).toLocaleDateString()}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-slate-400 hover:text-rose-600 transition p-1"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                              {note.content}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Added {new Date(note.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  /* ==================== TAB 3: MATCH BREAKDOWN ==================== */
                  <div className="space-y-4">
                    {selectedApplication.matchScore ? (
                      <>
                        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-900 uppercase">AI Weighted Match Evaluation</span>
                            <span className="text-base font-extrabold text-indigo-700">
                              {Math.round(selectedApplication.matchScore.final_score)}%
                            </span>
                          </div>
                          <p className="text-xs text-indigo-800 leading-relaxed">
                            {selectedApplication.matchScore.explanation}
                          </p>
                        </div>

                        {/* Matched Skills */}
                        <div>
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            Skills You Match ({selectedApplication.matchScore.matched_skills?.length || 0})
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedApplication.matchScore.matched_skills || []).map((sk, idx) => (
                              <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                                ✓ {sk}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Missing Skills */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <AlertCircle size={14} className="text-amber-500" />
                            Areas for Growth ({selectedApplication.matchScore.missing_skills?.length || 0})
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedApplication.matchScore.missing_skills || []).map((sk, idx) => (
                              <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                                + {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-xs text-slate-400">
                        Detailed match breakdown is computed upon full application submission.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  {selectedApplication.status === 'saved' ? (
                    <button
                      type="button"
                      onClick={() => setApplyModalApp(selectedApplication)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={15} />
                      Submit Application Now
                    </button>
                  ) : !['withdrawn', 'rejected', 'selected'].includes(selectedApplication.status) ? (
                    <button
                      type="button"
                      onClick={() => setWithdrawModalApp(selectedApplication)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
                    >
                      Withdraw Application
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedApplication(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUBMIT SAVED MODAL ==================== */}
        {applyModalApp && (
          <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Submit Application to {applyModalApp.company_name}
              </h3>
              <p className="text-xs text-slate-500">
                You are moving <strong>{applyModalApp.job_title}</strong> from your Saved Wishlist into active recruitment screening.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Optional Cover Note to Recruiter
                </label>
                <textarea
                  rows={4}
                  placeholder="Share a brief note on why you're passionate about this role..."
                  value={applyCoverNote}
                  onChange={e => setApplyCoverNote(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalApp(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingApply}
                  onClick={handlePromoteToApplied}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingApply ? 'Submitting...' : 'Confirm Application'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== WITHDRAW CONFIRMATION MODAL ==================== */}
        {withdrawModalApp && (
          <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Withdraw Application?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to withdraw your application for <strong>{withdrawModalApp.job_title}</strong> at {withdrawModalApp.company_name}? This action will update your status and stop recruiter review.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for withdrawal (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Accepted another offer, scheduling conflict..."
                  value={withdrawReason}
                  onChange={e => setWithdrawReason(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalApp(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Keep Application
                </button>
                <button
                  type="button"
                  disabled={submittingWithdraw}
                  onClick={handleWithdraw}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
                >
                  {submittingWithdraw ? 'Withdrawing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CareerPathApplications;

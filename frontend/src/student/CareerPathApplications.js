import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Columns,
  List,
  MessageSquare,
  Trash2,
  Plus,
  MapPin,
  Bookmark,
  X,
  Calendar,
  Activity,
  Award,
  Bell
} from 'lucide-react';
import { api } from '../api/client';

const STAGES = [
  { id: 'saved', label: 'Saved / Wishlist', color: 'sky', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', icon: Bookmark },
  { id: 'applied', label: 'Applied', color: 'indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: CheckCircle2 },
  { id: 'under_review', label: 'Under Review', color: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: Clock },
  { id: 'interview', label: 'Interview Scheduled', color: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: MessageSquare },
  { id: 'offer', label: 'Offer Received', color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: Award },
  { id: 'rejected', label: 'Closed / Rejected', color: 'slate', bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-700', icon: X }
];

export function CareerPathApplications() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    saved: 0,
    applied: 0,
    under_review: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    active: 0,
    response_rate: 0,
    upcoming_reminders: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list' | 'timeline'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail Modal State
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('timeline'); // 'timeline' | 'notes' | 'info'

  // Quick-Add Application State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    company: '',
    title: '',
    location: '',
    status: 'applied',
    notes: '',
    reminderDate: ''
  });
  const [submittingQuickAdd, setSubmittingQuickAdd] = useState(false);

  // Add Note State
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [noteReminderDate, setNoteReminderDate] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Fetch Applications and Analytics Stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [appsRes, statsRes] = await Promise.all([
        api.get('/api/applications/my-applications'),
        api.get('/api/applications/stats').catch(err => {
          console.warn('Failed to load application stats:', err.message);
          return { success: false, data: null };
        })
      ]);

      if (appsRes && appsRes.success) {
        setApplications(appsRes.data || []);
      }
      if (statsRes && statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
      const status = err.status || err.data?.status;
      const msg = status === 401 ? 'Session expired. Please sign in.' : (err.message || 'Failed to load application tracker');
      setError(msg);
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Open Application Detail Drawer
  const handleOpenDetail = async (appId) => {
    try {
      setDetailLoading(true);
      setSelectedApplication(null);
      const res = await api.get(`/api/applications/${appId}`);
      if (res && res.success && res.data) {
        setSelectedApplication(res.data);
      }
    } catch (err) {
      showNotification('Failed to load application details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  // 3. Move Stage (Kanban Movement)
  const handleMoveStage = async (appId, newStatus) => {
    // Optimistic Update
    setApplications(prev =>
      prev.map(a => (a.id === appId ? { ...a, status: newStatus } : a))
    );

    try {
      await api.patch(`/api/applications/${appId}/status`, {
        status: newStatus,
        notes: `Moved to ${newStatus} via student Kanban tracker`
      });
      showNotification(`Application moved to ${newStatus.replace('_', ' ')}`);
      // Refresh stats
      api.get('/api/applications/stats').then(res => {
        if (res && res.success && res.data) setStats(res.data);
      }).catch(err => console.warn('Failed to refresh stats:', err.message));
    } catch (err) {
      fetchData(); // revert
      showNotification('Failed to update application stage', 'error');
    }
  };

  // 4. Quick-Add Custom External Application
  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!quickAddData.company || !quickAddData.title) {
      showNotification('Company and Role Title are required', 'error');
      return;
    }

    try {
      setSubmittingQuickAdd(true);
      const res = await api.post('/api/applications', {
        company: quickAddData.company,
        title: quickAddData.title,
        location: quickAddData.location || 'Remote / Flexible',
        status: quickAddData.status,
        notes: quickAddData.notes || null,
        reminderDate: quickAddData.reminderDate || null
      });

      if (res && res.success) {
        showNotification(`Tracked application for ${quickAddData.title} at ${quickAddData.company}!`);
        setIsQuickAddOpen(false);
        setQuickAddData({
          company: '',
          title: '',
          location: '',
          status: 'applied',
          notes: '',
          reminderDate: ''
        });
        fetchData();
      }
    } catch (err) {
      const msg = err.data?.message || err.data?.error || err.message || 'Failed to track application';
      showNotification(msg, 'error');
    } finally {
      setSubmittingQuickAdd(false);
    }
  };

  // 5. Add Note to Application
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedApplication) return;

    try {
      setSubmittingNote(true);
      const res = await api.post(`/api/applications/${selectedApplication.id}/notes`, {
        content: noteContent,
        noteType,
        reminderDate: noteReminderDate || null
      });

      if (res && res.success) {
        showNotification('Note added successfully!');
        setNoteContent('');
        setNoteReminderDate('');
        // Refresh selected application detail
        handleOpenDetail(selectedApplication.id);
        fetchData();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to add note', 'error');
    } finally {
      setSubmittingNote(false);
    }
  };

  // 6. Delete Note
  const handleDeleteNote = async (noteId) => {
    if (!selectedApplication) return;
    try {
      await api.delete(`/api/applications/${selectedApplication.id}/notes/${noteId}`);
      showNotification('Note deleted');
      handleOpenDetail(selectedApplication.id);
    } catch (err) {
      showNotification('Failed to delete note', 'error');
    }
  };

  // 7. Withdraw / Remove Application
  const handleWithdrawApplication = async (appId) => {
    try {
      await api.delete(`/api/applications/${appId}`);
      showNotification('Application updated / withdrawn');
      if (selectedApplication?.id === appId) setSelectedApplication(null);
      fetchData();
    } catch (err) {
      showNotification('Failed to withdraw application', 'error');
    }
  };

  // Filtered Applications for Search
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchSearch =
        !searchQuery ||
        (app.job_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const normalizedAppStatus = app.status === 'selected' ? 'offer' : app.status;
      const matchStatus = statusFilter === 'all' || app.status === statusFilter || normalizedAppStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  // Group applications by stage for Kanban
  const kanbanColumns = useMemo(() => {
    const map = {
      saved: [],
      applied: [],
      under_review: [],
      interview: [],
      offer: [],
      rejected: []
    };

    filteredApplications.forEach(app => {
      if (map[app.status]) {
        map[app.status].push(app);
      } else if (app.status === 'screening' || app.status === 'shortlisted') {
        map.under_review.push(app);
      } else if (app.status === 'selected') {
        map.offer.push(app);
      } else if (app.status === 'withdrawn') {
        map.rejected.push(app);
      } else {
        map.applied.push(app);
      }
    });

    return map;
  }, [filteredApplications]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 shadow-lg text-sm font-bold border transition-all ${
          toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div data-testid="applications-error-alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Hero Header & Analytics KPI Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Activity size={15} />
                <span>Placement Pipeline & Kanban Tracker</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Application Tracker
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Manage your campus and off-campus recruitment pipeline from Wishlist to Offer with full stage audit logs, interview reminders, and notes.
              </p>
            </div>

            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-xs flex items-center gap-1.5 transition self-start md:self-center"
            >
              <Plus size={16} /> Track External Application
            </button>
          </div>

          {/* Application Analytics Strip */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Tracked</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.total || 0}</p>
            </div>
            <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 text-center">
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Applied</p>
              <p className="text-xl font-extrabold text-indigo-700 mt-0.5">{stats.applied || 0}</p>
            </div>
            <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100 text-center">
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">In Review</p>
              <p className="text-xl font-extrabold text-amber-700 mt-0.5">{stats.under_review || 0}</p>
            </div>
            <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100 text-center">
              <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Interviews</p>
              <p className="text-xl font-extrabold text-purple-700 mt-0.5">{stats.interview || 0}</p>
            </div>
            <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 text-center">
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Offers</p>
              <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{stats.offer || 0}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Rate</p>
              <p className="text-xl font-extrabold text-indigo-600 mt-0.5">{stats.response_rate || 0}%</p>
            </div>
          </div>
        </div>

        {/* Upcoming Reminders Alert (if any) */}
        {stats.upcoming_reminders && stats.upcoming_reminders.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Bell size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-extrabold text-amber-900">Upcoming Interview & Task Reminders</p>
              <div className="flex flex-wrap gap-3 mt-1.5">
                {stats.upcoming_reminders.map(r => (
                  <span key={r.id} className="bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-800 font-bold flex items-center gap-1.5">
                    <Calendar size={12} />
                    {r.company} ({r.title}): {new Date(r.reminder_date).toLocaleDateString()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controls Row: Search & View Switcher (Kanban, List, Timeline) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View Mode Switcher */}
            <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-1 shadow-2xs">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition ${
                  viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns size={13} /> Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List size={13} /> List
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition ${
                  viewMode === 'timeline' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock size={13} /> Timeline
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter for List View */}
        {viewMode === 'list' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4">
            {[{ id: 'all', label: 'All Stages' }, ...STAGES].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  statusFilter === st.id ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex h-72 items-center justify-center bg-white rounded-3xl border border-slate-200">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading your recruitment pipeline...</p>
            </div>
          </div>
        ) : (
          <>
            {/* 1. KANBAN BOARD VIEW */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {STAGES.map(stage => {
              const StageIcon = stage.icon;
              const cards = kanbanColumns[stage.id] || [];

              return (
                <div
                  key={stage.id}
                  className="bg-slate-100/70 rounded-3xl p-3.5 border border-slate-200/80 min-w-[260px] flex flex-col h-full"
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`p-1 rounded-lg ${stage.bg} ${stage.text}`}>
                        <StageIcon size={14} />
                      </span>
                      <h3 className="text-xs font-extrabold text-slate-800">{stage.label}</h3>
                    </div>
                    <span className="text-[11px] font-extrabold bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                      {cards.length}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                    {cards.length === 0 ? (
                      <div className="text-center py-8 rounded-2xl border border-dashed border-slate-300 text-[11px] text-slate-400 font-semibold">
                        No applications in {stage.label}
                      </div>
                    ) : (
                      cards.map(card => {
                        const matchScore = card.match_score !== null && card.match_score !== undefined ? Math.round(card.match_score) : null;

                        return (
                          <div
                            key={card.id}
                            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer"
                            onClick={() => handleOpenDetail(card.id)}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wide truncate">
                                {card.company_name}
                              </span>
                              {matchScore !== null && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  {matchScore}%
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug mb-2">
                              {card.job_title || card.role_title}
                            </h4>

                            {/* Location & Resume Version */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                              <span className="flex items-center gap-1">
                                <MapPin size={11} className="text-slate-400" />
                                {card.job_location || 'Flexible'}
                              </span>
                              {card.resume_version_label && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold">
                                  📄 {card.resume_version_label}
                                </span>
                              )}
                            </div>

                            {/* Reminder Badge */}
                            {card.reminder_date && (
                              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold mb-3 flex items-center gap-1">
                                <Calendar size={11} />
                                {new Date(card.reminder_date).toLocaleDateString()}
                              </div>
                            )}

                            {/* Stage Mover Selector */}
                            <div
                              className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]"
                              onClick={e => e.stopPropagation()}
                            >
                              <span className="text-slate-400 font-bold">Move:</span>
                              <select
                                value={stage.id}
                                onChange={e => handleMoveStage(card.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 text-[10px] focus:outline-none"
                              >
                                {STAGES.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. LIST VIEW */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Company & Role</th>
                    <th className="py-3.5 px-4">Stage</th>
                    <th className="py-3.5 px-4">Match %</th>
                    <th className="py-3.5 px-4">Applied Date</th>
                    <th className="py-3.5 px-4">Resume Version</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold">
                        No applications match your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map(app => {
                      const stageObj = STAGES.find(s => s.id === (app.status === 'selected' ? 'offer' : app.status)) || STAGES[1];
                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-slate-50 transition cursor-pointer"
                          onClick={() => handleOpenDetail(app.id)}
                        >
                          <td className="py-3.5 px-6">
                            <p className="font-extrabold text-indigo-600 uppercase text-[10px]">{app.company_name}</p>
                            <p className="font-bold text-slate-900 text-sm mt-0.5">{app.job_title || app.role_title}</p>
                            <span className="text-slate-400 text-[11px]">{app.job_location}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${stageObj.bg} ${stageObj.border} ${stageObj.text}`}>
                              {stageObj.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {app.match_score !== null ? (
                              <span className="font-bold text-slate-800">{Math.round(app.match_score)}%</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">
                            {new Date(app.applied_at || app.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {app.resume_version_label || 'v1-default'}
                          </td>
                          <td className="py-3.5 px-6 text-right" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenDetail(app.id)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-indigo-600 hover:bg-slate-50"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. TIMELINE VIEW */}
        {viewMode === 'timeline' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <Clock size={18} className="text-indigo-600" />
              Chronological Recruitment Activity Timeline
            </h3>

            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
              {filteredApplications.map(app => (
                <div key={`tl-${app.id}`} className="relative pl-6">
                  <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-indigo-600 uppercase">{app.company_name}</span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {new Date(app.applied_at || app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{app.job_title}</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Current Status: <span className="font-bold text-indigo-700 uppercase">{app.status}</span>
                      {app.notes && ` • "${app.notes}"`}
                    </p>
                    <button
                      onClick={() => handleOpenDetail(app.id)}
                      className="text-xs font-bold text-indigo-600 hover:underline mt-2 inline-block"
                    >
                      View Full Details & Notes →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Detail Drawer & Notes Modal */}
      {(selectedApplication || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            {detailLoading ? (
              <div className="py-16 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading application details...</p>
              </div>
            ) : selectedApplication && (
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
                      {selectedApplication.company_name}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedApplication.job_title}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedApplication.job_location} • Status: <span className="font-bold text-indigo-700 uppercase">{selectedApplication.status}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-slate-400 hover:text-slate-700 p-2 rounded-lg text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-6">
                  <button
                    onClick={() => setActiveDetailTab('timeline')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeDetailTab === 'timeline' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Stage History ({selectedApplication.history?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('notes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeDetailTab === 'notes' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Private Notes & Reminders ({selectedApplication.notes?.length || 0})
                  </button>
                </div>

                {/* Tab Content: Timeline */}
                {activeDetailTab === 'timeline' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Audit History</h4>
                    {selectedApplication.history && selectedApplication.history.length > 0 ? (
                      <div className="space-y-3">
                        {selectedApplication.history.map(item => (
                          <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                              <span className="font-bold text-indigo-600 uppercase">{item.new_status}</span>
                              <span>{new Date(item.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-700 font-medium">{item.notes || 'Status changed'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No stage history recorded yet.</p>
                    )}
                  </div>
                )}

                {/* Tab Content: Notes & Reminders */}
                {activeDetailTab === 'notes' && (
                  <div>
                    {/* Add Note Form */}
                    <form onSubmit={handleAddNote} className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-900">Add Interview Prep / Application Note</h4>
                      <textarea
                        rows={3}
                        placeholder="Write down round details, technical questions asked, follow-up dates..."
                        value={noteContent}
                        onChange={e => setNoteContent(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">Note Type</label>
                          <select
                            value={noteType}
                            onChange={e => setNoteType(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold"
                          >
                            <option value="general">General</option>
                            <option value="interview_prep">Interview Prep</option>
                            <option value="follow_up">Follow Up</option>
                            <option value="offer_details">Offer Details</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">Reminder Date</label>
                          <input
                            type="datetime-local"
                            value={noteReminderDate}
                            onChange={e => setNoteReminderDate(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold"
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <button
                          type="submit"
                          disabled={submittingNote || !noteContent.trim()}
                          className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs"
                        >
                          {submittingNote ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </form>

                    {/* Notes List */}
                    <div className="space-y-3">
                      {selectedApplication.notes && selectedApplication.notes.length > 0 ? (
                        selectedApplication.notes.map(note => (
                          <div key={note.id} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {note.note_type}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">{new Date(note.created_at).toLocaleDateString()}</span>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            <p className="text-slate-700 font-medium whitespace-pre-line mt-1.5">{note.content}</p>
                            {note.reminder_date && (
                              <div className="mt-2 text-[10px] font-bold text-purple-700 flex items-center gap-1">
                                <Calendar size={11} /> Reminder: {new Date(note.reminder_date).toLocaleString()}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-4">No notes added yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleWithdrawApplication(selectedApplication.id)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    Withdraw Application
                  </button>

                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick-Add External Application Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Track External Job Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add roles you applied to directly on company portals (e.g. Google, Amazon, Microsoft)
                </p>
              </div>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Google, Atlassian, Zepto"
                  required
                  value={quickAddData.company}
                  onChange={e => setQuickAddData({ ...quickAddData, company: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Role Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Software Development Engineer Intern"
                  required
                  value={quickAddData.title}
                  onChange={e => setQuickAddData({ ...quickAddData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Bangalore / Remote"
                    value={quickAddData.location}
                    onChange={e => setQuickAddData({ ...quickAddData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Stage</label>
                  <select
                    value={quickAddData.status}
                    onChange={e => setQuickAddData({ ...quickAddData, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="saved">Saved / Wishlist</option>
                    <option value="applied">Applied</option>
                    <option value="under_review">Under Review</option>
                    <option value="interview">Interview Scheduled</option>
                    <option value="offer">Offer Received</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Interview / Reminder Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={quickAddData.reminderDate}
                  onChange={e => setQuickAddData({ ...quickAddData, reminderDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Initial Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Referral source, job link, recruiter contact..."
                  value={quickAddData.notes}
                  onChange={e => setQuickAddData({ ...quickAddData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuickAdd}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  {submittingQuickAdd ? 'Saving...' : 'Add to Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

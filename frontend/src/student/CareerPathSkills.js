import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Code,
  Server,
  Layers,
  Cpu,
  Terminal,
  Play,
  X
} from 'lucide-react';
import { api } from '../api/client';

const ROLE_ICONS = {
  fullstack: Layers,
  backend: Server,
  frontend: Code,
  ai_data: Cpu,
  devops: Terminal
};

export function CareerPathSkills() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('fullstack');
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [allCanonicalSkills, setAllCanonicalSkills] = useState([]);
  const [studentSkills, setStudentSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Add Skill Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState('intermediate');
  const [submittingSkill, setSubmittingSkill] = useState(false);

  const [error, setError] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial Load: Target Roles, Canonical Skills, and Student Profile Skills
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setError(null);
        const [rolesRes, skillsRes, meRes] = await Promise.all([
          api.get('/api/skills/roles').catch(err => {
            console.warn('Failed to load roles:', err.message);
            return { success: false, data: [] };
          }),
          api.get('/api/skills').catch(err => {
            console.warn('Failed to load canonical skills:', err.message);
            return { success: false, data: [] };
          }),
          api.get('/api/students/me').catch(err => {
            console.warn('Failed to load student profile for skills:', err.message);
            return { success: false, data: null };
          })
        ]);

        if (rolesRes && rolesRes.success) {
          setRoles(rolesRes.data || []);
        }
        if (skillsRes && skillsRes.success) {
          setAllCanonicalSkills(skillsRes.data || []);
        }
        if (meRes && meRes.success && meRes.data?.skills) {
          setStudentSkills(meRes.data.skills || []);
          if (meRes.data.preferred_role) {
            const pref = meRes.data.preferred_role.toLowerCase();
            if (pref.includes('backend')) setSelectedRole('backend');
            else if (pref.includes('front')) setSelectedRole('frontend');
            else if (pref.includes('data') || pref.includes('ai')) setSelectedRole('ai_data');
            else if (pref.includes('devops') || pref.includes('cloud')) setSelectedRole('devops');
          }
        }

        if (!rolesRes.success && !skillsRes.success && !meRes.success) {
          throw new Error('Failed to load initial skills data');
        }
      } catch (err) {
        console.error('Failed to load initial skills data:', err);
        setError(err.message || 'Failed to load skills data');
        showNotification('Failed to load skills data', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. Compute Gap Analysis whenever selectedRole or studentSkills change
  const runGapAnalysis = useCallback(async (roleKey) => {
    try {
      setAnalyzing(true);
      const res = await api.get(`/api/skills/gap-analysis?role=${roleKey}`);
      if (res && res.success && res.data) {
        const roleMeta = roles.find(r => r.id === roleKey);
        const mappedMissingSkills = Array.isArray(res.data.missingSkills)
          ? res.data.missingSkills
          : Array.isArray(res.data.missing_skills)
          ? res.data.missing_skills.map(skill =>
              typeof skill === 'string' ? { name: skill, priority: 'recommended' } : skill
            )
          : [];
        const mappedAcquiredSkills = Array.isArray(res.data.acquiredSkills)
          ? res.data.acquiredSkills
          : Array.isArray(res.data.matched_skills)
          ? res.data.matched_skills.map(skill =>
              typeof skill === 'string'
                ? { name: skill, proficiency: 'intermediate', priority: 'critical' }
                : skill
            )
          : [];

        setGapAnalysis({
          ...res.data,
          targetRole: res.data.targetRole || {
            id: roleMeta?.id || roleKey,
            title: roleMeta?.title || roleMeta?.name || roleKey,
            description: roleMeta?.description || ''
          },
          readinessScore: res.data.readinessScore ?? res.data.readiness_percentage ?? 0,
          acquiredSkills: mappedAcquiredSkills,
          missingSkills: mappedMissingSkills,
          acquiredCount: res.data.acquiredCount ?? mappedAcquiredSkills.length,
          missingCount: res.data.missingCount ?? mappedMissingSkills.length
        });
      }
    } catch (err) {
      console.error('Failed to compute gap analysis:', err);
      showNotification('Failed to compute role gap analysis', 'error');
    } finally {
      setAnalyzing(false);
    }
  }, [roles]);

  useEffect(() => {
    if (!loading) {
      runGapAnalysis(selectedRole);
    }
  }, [selectedRole, loading, runGapAnalysis]);

  // 3. Add Skill to Profile
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    try {
      setSubmittingSkill(true);
      const res = await api.post('/api/students/me/skills', {
        skillId: Number(selectedSkillId),
        proficiencyLevel: selectedProficiency
      });

      if (res && res.success) {
        showNotification('Skill added to your profile!');
        setStudentSkills(res.data?.skills || res.data || []);
        setIsAddModalOpen(false);
        setSelectedSkillId('');
        setSkillSearch('');
        // Re-run gap analysis
        await runGapAnalysis(selectedRole);
      }
    } catch (err) {
      console.error('Failed to add skill:', err);
      showNotification(err.message || 'Failed to add skill', 'error');
    } finally {
      setSubmittingSkill(false);
    }
  };

  // 4. Quick Add Missing Skill directly from gap card
  const handleQuickAddMissing = async (skillName) => {
    const canonical = allCanonicalSkills.find(
      s => s.canonical_name.toLowerCase() === skillName.toLowerCase()
    );
    if (!canonical) {
      showNotification(`Skill ${skillName} can be added via the Add Skill dialogue`, 'info');
      setIsAddModalOpen(true);
      setSkillSearch(skillName);
      return;
    }

    try {
      const res = await api.post('/api/students/me/skills', {
        skillId: canonical.id,
        proficiencyLevel: 'intermediate'
      });

      if (res && res.success) {
        showNotification(`✓ ${skillName} added to your verified skills!`);
        setStudentSkills(res.data?.skills || res.data || []);
        await runGapAnalysis(selectedRole);
      }
    } catch (err) {
      console.error('Failed to quick-add skill:', err);
      showNotification(err.message || 'Failed to add skill', 'error');
    }
  };

  // 5. Update Skill Proficiency
  const handleUpdateProficiency = async (skillId, newProficiency) => {
    try {
      const res = await api.post('/api/students/me/skills', {
        skillId,
        proficiencyLevel: newProficiency
      });

      if (res && res.success) {
        showNotification('Proficiency updated');
        setStudentSkills(res.data?.skills || res.data || []);
        await runGapAnalysis(selectedRole);
      }
    } catch (err) {
      console.error('Failed to update proficiency:', err);
      showNotification('Failed to update proficiency', 'error');
    }
  };

  // 6. Delete Skill
  const handleDeleteSkill = async (skillId) => {
    try {
      const res = await api.delete(`/api/students/me/skills/${skillId}`);
      if (res && res.success) {
        showNotification('Skill removed from profile');
        setStudentSkills(res.data?.skills || res.data || []);
        await runGapAnalysis(selectedRole);
      }
    } catch (err) {
      console.error('Failed to delete skill:', err);
      showNotification('Failed to remove skill', 'error');
    }
  };

  // Filter canonical skills in Add Modal
  const filteredModalSkills = allCanonicalSkills.filter(s => {
    const matchesSearch = !skillSearch || s.canonical_name.toLowerCase().includes(skillSearch.toLowerCase());
    const alreadyHas = studentSkills.some(sk => sk.skill_id === s.id);
    return matchesSearch && !alreadyHas;
  });

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-emerald-600 stroke-emerald-500';
    if (score >= 50) return 'text-indigo-600 stroke-indigo-500';
    return 'text-amber-500 stroke-amber-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-500">Loading your skill benchmark intelligence...</p>
      </div>
    );
  }

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

      <div className="max-w-7xl mx-auto space-y-8">
        {error && (
          <div data-testid="skills-error-alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-700 hover:text-rose-900 underline font-semibold ml-auto"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700 mb-2">
              <Sparkles size={13} className="text-indigo-600" />
              Career Readiness & Gap Diagnostics
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Skills Management & Gap Analysis
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Benchmark your skills against MCA placement roles, analyze gaps, and master required competencies with curated free courses.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs transition self-start md:self-auto"
          >
            <Plus size={16} />
            Add Verified Skill
          </button>
        </div>

        {/* Target Role Selector Pills / Cards */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Select Your Target MCA Career Role
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {roles.map((r, idx) => {
              const Icon = ROLE_ICONS[r.id] || Compass;
              const isSelected = selectedRole === r.id;
              const isLastOdd = idx === roles.length - 1 && roles.length % 2 === 1;

              return (
                <button
                  key={r.id || r.name || idx}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 ${
                    isLastOdd ? 'col-span-2 sm:col-span-1 ' : ''
                  }${
                    isSelected
                      ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon size={18} />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold leading-snug ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                      {r.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {r.criticalSkills?.length + r.recommendedSkills?.length} benchmark skills
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Role Readiness Score Card & Summary */}
        {gapAnalysis && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              {/* Radial Score Gauge */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`${getScoreColor(gapAnalysis.readinessScore)} transition-all duration-1000 ease-out`}
                    strokeDasharray={`${gapAnalysis.readinessScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-extrabold text-slate-900 leading-none">
                    {analyzing ? '...' : `${gapAnalysis.readinessScore}%`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                    {analyzing ? 'Calculating' : 'Readiness'}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {gapAnalysis.targetRole.title} Profile Fit
                </h2>
                <p className="text-xs text-slate-500 max-w-lg mt-1 leading-relaxed">
                  {gapAnalysis.targetRole.description}
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 size={13} /> {gapAnalysis.acquiredCount} Skills Acquired
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <AlertCircle size={13} /> {gapAnalysis.missingCount} Gaps to Bridge
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 w-full md:w-auto text-xs space-y-2">
              <p className="font-bold text-slate-800">Fast-Track Recommendations</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {gapAnalysis.readinessScore >= 75
                  ? 'Excellent readiness! Focus on your portfolio projects and start applying.'
                  : gapAnalysis.readinessScore >= 50
                  ? 'Strong baseline! Bridge 1-2 critical skill gaps to qualify for top-tier campus interviews.'
                  : 'Start with the free masterclasses below to quickly acquire foundational skills.'}
              </p>
            </div>
          </div>
        )}

        {/* Split Grid: Gaps Breakdown vs Curated Learning Resources */}
        {gapAnalysis && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Skills Gap Analyzer */}
            <div className="lg:col-span-7 space-y-6">
              {/* Critical Missing Skills */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Critical Core Gaps ({gapAnalysis.missingSkills?.filter(m => m.priority === 'critical').length || 0})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Must-have competencies for this role</span>
                </div>

                {gapAnalysis.missingSkills?.filter(m => m.priority === 'critical').length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    You possess all critical core skills for {gapAnalysis.targetRole.title}!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {gapAnalysis.missingSkills?.filter(m => m.priority === 'critical').map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/30 flex items-center justify-between gap-3 group hover:border-rose-300 transition"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{m.name}</p>
                          <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider">
                            Critical Core
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickAddMissing(m.name)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 shadow-2xs transition shrink-0 flex items-center gap-1"
                        >
                          <Plus size={12} />
                          Learned it
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended Differentiating Skills */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Recommended Differentiators ({gapAnalysis.missingSkills?.filter(m => m.priority === 'recommended').length || 0})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Elevate your hiring candidacy</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {gapAnalysis.missingSkills?.filter(m => m.priority === 'recommended').map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/20 flex items-center justify-between gap-3 group hover:border-amber-300 transition"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{m.name}</p>
                        <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                          Recommended
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickAddMissing(m.name)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 shadow-2xs transition shrink-0 flex items-center gap-1"
                      >
                        <Plus size={12} />
                        Learned it
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched Acquired Skills */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Skills Already Acquired ({gapAnalysis.acquiredSkills?.length || 0})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Matched to {gapAnalysis.targetRole.title}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {gapAnalysis.acquiredSkills?.map((s, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-2 text-xs"
                    >
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200 uppercase">
                        {s.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Curated Learning Resources */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-600" />
                      Curated Free Masterclasses
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Targeted free resources to bridge your current skill gaps
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(gapAnalysis.recommendedResources || []).length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      No gap-specific courses needed. Explore advanced system design tutorials!
                    </p>
                  ) : (
                    gapAnalysis.recommendedResources.map(res => (
                      <a
                        key={res.id}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 transition group"
                      >
                        <div className="flex items-start gap-3">
                          {res.thumbnail_url ? (
                            <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-800">
                              <img
                                src={res.thumbnail_url}
                                alt={res.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Play size={14} className="text-white fill-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                              <Code size={18} />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                                {res.gap_area}
                              </span>
                              <span className="text-[10px] text-slate-400 capitalize">
                                • {res.resource_type}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition line-clamp-2 leading-snug">
                              {res.title}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mt-1.5">
                              Watch Free Tutorial <ExternalLink size={11} />
                            </div>
                          </div>
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Student Skills Inventory Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Your Complete Verified Skill Inventory ({studentSkills.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your acquired technical proficiencies. Changes automatically recalculate your job match scores.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Skill
            </button>
          </div>

          {studentSkills.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <p className="text-xs text-slate-400">
                No skills added to your profile yet. Add your core languages, frameworks, and databases above!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {studentSkills.map(sk => (
                <div
                  key={sk.id || sk.skill_id}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs hover:bg-slate-50 transition"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {sk.skill_name || sk.canonical_name}
                    </p>
                    <select
                      value={sk.proficiency_level || 'intermediate'}
                      onChange={e => handleUpdateProficiency(sk.skill_id, e.target.value)}
                      aria-label="Update proficiency level"
                      className="text-[11px] font-medium text-slate-500 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer hover:text-indigo-600"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSkill(sk.skill_id)}
                    title="Remove skill"
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ==================== ADD SKILL MODAL ==================== */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  Add Verified Skill
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSkill} className="space-y-4">
                {/* Search Canonical Skills */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Canonical Skill
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="text"
                      placeholder="Filter skills (e.g. React, Python, Docker)..."
                      value={skillSearch}
                      onChange={e => setSkillSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <select
                    size={5}
                    value={selectedSkillId}
                    onChange={e => setSelectedSkillId(e.target.value)}
                    aria-label="Available canonical skills"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  >
                    {filteredModalSkills.map(s => (
                      <option key={s.id} value={s.id} className="py-1 px-2 rounded hover:bg-indigo-50">
                        {s.canonical_name} {s.category_name ? `(${s.category_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Proficiency Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Proficiency Level
                  </label>
                  <select
                    value={selectedProficiency}
                    onChange={e => setSelectedProficiency(e.target.value)}
                    aria-label="Proficiency level selection"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  >
                    <option value="beginner">Beginner (Familiar with fundamentals)</option>
                    <option value="intermediate">Intermediate (Built projects / applied work)</option>
                    <option value="expert">Expert (Production / deep understanding)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSkill || !selectedSkillId}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-xs"
                  >
                    {submittingSkill ? 'Adding...' : 'Add to Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CareerPathSkills;

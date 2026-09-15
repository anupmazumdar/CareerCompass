import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Code2,
  FolderGit2,
  Award,
  FileText,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Check,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';

export function CareerPathProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, education, skills, projects, certifications, resume
  const [toast, setToast] = useState(null);

  // Modals / Form States
  const [personalForm, setPersonalForm] = useState({
    headline: '',
    bio: '',
    location: '',
    phone: '',
    preferred_role: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: ''
  });

  const [eduForm, setEduForm] = useState({
    institution: '',
    degree: '',
    field_of_study: 'Computer Science & Engineering',
    start_year: 2022,
    end_year: 2026,
    grade_or_cgpa: ''
  });
  const [showEduModal, setShowEduModal] = useState(false);

  const [projForm, setProjForm] = useState({
    title: '',
    description: '',
    technologies: '',
    project_url: '',
    github_url: ''
  });
  const [showProjModal, setShowProjModal] = useState(false);

  const [certForm, setCertForm] = useState({
    title: '',
    issuing_organization: '',
    issue_date: '',
    credential_id: '',
    credential_url: ''
  });
  const [showCertModal, setShowCertModal] = useState(false);

  const [skillInput, setSkillInput] = useState({ skillId: 1, proficiencyLevel: 'intermediate' });
  const [availableSkills, setAvailableSkills] = useState([]);

  // Resume Upload State
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profRes, skillsRes] = await Promise.all([
        api.get('/api/students/me').catch(() => ({ data: null })),
        api.get('/api/skills').catch(() => ({ data: [] }))
      ]);

      if (profRes && profRes.data) {
        const p = profRes.data.data || profRes.data;
        setProfile(p);
        setPersonalForm({
          headline: p.headline || '',
          bio: p.bio || '',
          location: p.location || '',
          phone: p.phone || '',
          preferred_role: p.preferred_role || '',
          github_url: p.github_url || '',
          linkedin_url: p.linkedin_url || '',
          portfolio_url: p.portfolio_url || ''
        });
      }

      if (skillsRes && skillsRes.data) {
        const list = Array.isArray(skillsRes.data) ? skillsRes.data : (skillsRes.data.skills || []);
        setAvailableSkills(list);
        if (list.length > 0) {
          setSkillInput(prev => ({ ...prev, skillId: list[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      showNotification('Unable to load student profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  // Handlers
  const handleSavePersonal = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/api/students/me', personalForm);
      if (res && res.data) {
        setProfile(res.data.data || res.data);
        showNotification('Personal details updated successfully');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update personal details', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEducation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/students/me/education', eduForm);
      if (res && res.data) {
        setProfile(res.data.data || res.data);
        setShowEduModal(false);
        setEduForm({
          institution: '',
          degree: '',
          field_of_study: 'Computer Science & Engineering',
          start_year: 2022,
          end_year: 2026,
          grade_or_cgpa: ''
        });
        showNotification('Education entry added');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to add education', 'error');
    }
  };

  const handleDeleteEducation = async (id) => {
    try {
      const res = await api.delete(`/api/students/me/education/${id}`);
      if (res && res.data) {
        setProfile(res.data.data || res.data);
        showNotification('Education entry deleted');
      }
    } catch (err) {
      showNotification('Failed to remove education', 'error');
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      const techs = projForm.technologies
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await api.post('/api/students/me/projects', {
        ...projForm,
        technologies: techs
      });
      if (res && res.data) {
        setProfile(res.data.data || res.data);
        setShowProjModal(false);
        setProjForm({ title: '', description: '', technologies: '', project_url: '', github_url: '' });
        showNotification('Project showcase added');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to add project', 'error');
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      const res = await api.delete(`/api/students/me/projects/${id}`);
      if (res && res.data) {
        setProfile(res.data.data || res.data);
        showNotification('Project removed');
      }
    } catch (err) {
      showNotification('Failed to remove project', 'error');
    }
  };

  const handleAddCertification = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/students/me/certifications', certForm);
      if (res && res.data) {
        setProfile(res.data.data || res.data);
        setShowCertModal(false);
        setCertForm({ title: '', issuing_organization: '', issue_date: '', credential_id: '', credential_url: '' });
        showNotification('Certification recorded');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to add certification', 'error');
    }
  };

  const handleDeleteCertification = async (id) => {
    try {
      const res = await api.delete(`/api/students/me/certifications/${id}`);
      if (res && res.data) {
        setProfile(res.data.data || res.data);
        showNotification('Certification deleted');
      }
    } catch (err) {
      showNotification('Failed to remove certification', 'error');
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/students/me/skills', skillInput);
      if (res && res.data) {
        setProfile(res.data.data || res.data);
        showNotification('Skill added to inventory');
      }
    } catch (err) {
      showNotification('Failed to add skill', 'error');
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      const res = await api.delete(`/api/students/me/skills/${skillId}`);
      if (res && res.data) {
        setProfile(res.data.data || res.data);
        showNotification('Skill removed from profile');
      }
    } catch (err) {
      showNotification('Failed to remove skill', 'error');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification('File exceeds 5 MB limit', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', personalForm.preferred_role || 'Software Engineer');

    try {
      setUploadingResume(true);
      const res = await api.post('/api/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.data) {
        setResumeAnalysis(res.data.data);
        showNotification('Resume verified, parsed, and skills extracted!');
        // Reload profile to refresh completeness
        loadProfileData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to process resume file';
      showNotification(msg, 'error');
    } finally {
      setUploadingResume(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading Student Career Profile...</p>
        </div>
      </div>
    );
  }

  const completeness = profile?.profile_completeness || 0;
  const getCompletenessBadge = (score) => {
    if (score >= 85) return { label: 'Industry Ready', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (score >= 60) return { label: 'Competitive', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (score >= 40) return { label: 'Developing', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Incomplete Profile', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  };
  const badge = getCompletenessBadge(completeness);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg text-sm font-medium border ${
          toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Profile Header Hero Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-indigo-100">
                {profile?.full_name ? profile.full_name.slice(0, 2).toUpperCase() : 'CP'}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{profile?.full_name || 'Student Profile'}</h1>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-slate-600 mt-1 font-medium">{profile?.headline || 'Add your career headline...'}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                  {profile?.location && <span className="flex items-center gap-1"><MapPin size={13} /> {profile.location}</span>}
                  {profile?.email && <span className="flex items-center gap-1"><Mail size={13} /> {profile.email}</span>}
                  {profile?.phone && <span className="flex items-center gap-1"><Phone size={13} /> {profile.phone}</span>}
                  {profile?.preferred_role && <span className="flex items-center gap-1 text-indigo-600 font-semibold"><Briefcase size={13} /> Target: {profile.preferred_role}</span>}
                </div>
              </div>
            </div>

            {/* Profile Completeness Visual Indicator */}
            <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 w-full md:w-auto">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#4f46e5"
                    strokeWidth="6"
                    strokeDasharray={163.36}
                    strokeDashoffset={163.36 - (163.36 * completeness) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-slate-900">{completeness}%</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completeness</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{completeness}% Filled</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {completeness < 80 ? 'Complete all sections to unlock top matching' : 'Optimized for campus recruitment'}
                </p>
              </div>
            </div>
          </div>

          {/* Social Links Row */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-slate-100">
            {profile?.github_url && (
              <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition">
                <Github size={14} /> GitHub Profile
              </a>
            )}
            {profile?.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition">
                <Linkedin size={14} /> LinkedIn
              </a>
            )}
            {profile?.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition">
                <Globe size={14} /> Portfolio Site
              </a>
            )}
            {!profile?.github_url && !profile?.linkedin_url && !profile?.portfolio_url && (
              <span className="text-xs text-slate-400">Add your GitHub, LinkedIn, or portfolio in Personal Details to build credibility.</span>
            )}
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-200">
          {[
            { id: 'overview', label: 'Overview & Bio', icon: User },
            { id: 'education', label: `Education (${profile?.education?.length || 0})`, icon: GraduationCap },
            { id: 'skills', label: `Skills (${profile?.skills?.length || 0})`, icon: Code2 },
            { id: 'projects', label: `Projects (${profile?.projects?.length || 0})`, icon: FolderGit2 },
            { id: 'certifications', label: `Certifications (${profile?.certifications?.length || 0})`, icon: Award },
            { id: 'resume', label: 'Resume & AI Parser', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT: Overview & Personal Form */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Edit Personal Information</h2>
              <form onSubmit={handleSavePersonal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Headline</label>
                  <input
                    type="text"
                    value={personalForm.headline}
                    onChange={e => setPersonalForm({ ...personalForm, headline: e.target.value })}
                    placeholder="e.g. MCA Student @ UIT | Full Stack Developer | React & Node.js"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Role</label>
                    <input
                      type="text"
                      value={personalForm.preferred_role}
                      onChange={e => setPersonalForm({ ...personalForm, preferred_role: e.target.value })}
                      placeholder="e.g. Software Engineer / Frontend Dev"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Location</label>
                    <input
                      type="text"
                      value={personalForm.location}
                      onChange={e => setPersonalForm({ ...personalForm, location: e.target.value })}
                      placeholder="e.g. Bangalore, India"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Professional Bio</label>
                  <textarea
                    rows={4}
                    value={personalForm.bio}
                    onChange={e => setPersonalForm({ ...personalForm, bio: e.target.value })}
                    placeholder="Describe your background, core technical interests, and what kind of opportunities you are seeking..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">GitHub URL</label>
                    <input
                      type="url"
                      value={personalForm.github_url}
                      onChange={e => setPersonalForm({ ...personalForm, github_url: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={personalForm.linkedin_url}
                      onChange={e => setPersonalForm({ ...personalForm, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Portfolio Site</label>
                    <input
                      type="url"
                      value={personalForm.portfolio_url}
                      onChange={e => setPersonalForm({ ...personalForm, portfolio_url: e.target.value })}
                      placeholder="https://mysite.dev"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-sm"
                  >
                    {saving ? 'Saving...' : 'Save Personal Details'}
                  </button>
                </div>
              </form>
            </div>

            {/* Side Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600" />
                Profile Strength Guide
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Recruiters prioritize verified student profiles with demonstrable project repositories.
              </p>

              <ul className="space-y-3 text-xs">
                <li className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${personalForm.headline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    <Check size={12} />
                  </span>
                  <span className={personalForm.headline ? 'font-semibold text-slate-800' : 'text-slate-500'}>Clear Headline & Target Role</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${profile?.education?.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    <Check size={12} />
                  </span>
                  <span className={profile?.education?.length > 0 ? 'font-semibold text-slate-800' : 'text-slate-500'}>Academic Degree Entry</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${profile?.skills?.length >= 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    <Check size={12} />
                  </span>
                  <span className={profile?.skills?.length >= 3 ? 'font-semibold text-slate-800' : 'text-slate-500'}>At least 3 verified technical skills</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${profile?.projects?.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    <Check size={12} />
                  </span>
                  <span className={profile?.projects?.length > 0 ? 'font-semibold text-slate-800' : 'text-slate-500'}>At least 1 showcase project with repo</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${profile?.certifications?.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    <Check size={12} />
                  </span>
                  <span className={profile?.certifications?.length > 0 ? 'font-semibold text-slate-800' : 'text-slate-500'}>Industry certification or valid resume</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB CONTENT: Education */}
        {activeTab === 'education' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Academic Background & Degrees</h2>
                <p className="text-xs text-slate-500 mt-0.5">List your graduate and undergraduate qualifications.</p>
              </div>
              <button
                onClick={() => setShowEduModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition"
              >
                <Plus size={15} /> Add Degree
              </button>
            </div>

            {(!profile?.education || profile.education.length === 0) ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <GraduationCap size={36} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No education entries added yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Add your college degree, field of study, and CGPA to calculate matching fit for graduate roles.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.education.map(edu => (
                  <div key={edu.id} className="flex items-start justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{edu.degree} in {edu.field_of_study || 'Computer Science'}</h3>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">{edu.institution}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span>{edu.start_year} — {edu.end_year || 'Present'}</span>
                        {edu.grade_or_cgpa && <span className="font-medium text-indigo-600">• CGPA / Grade: {edu.grade_or_cgpa}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEducation(edu.id)}
                      className="text-slate-400 hover:text-rose-600 p-2 rounded-lg transition"
                      title="Remove Degree"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: Skills */}
        {activeTab === 'skills' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Technical Skills & Proficiency</h2>
                <p className="text-xs text-slate-500 mt-0.5">Rate your proficiency level in languages, frameworks, and tools.</p>
              </div>

              {/* Add Skill Mini-Form */}
              <form onSubmit={handleAddSkill} className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={skillInput.skillId}
                  onChange={e => setSkillInput({ ...skillInput, skillId: Number(e.target.value) })}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableSkills.map(s => (
                    <option key={s.id} value={s.id}>{s.canonical_name || s.name}</option>
                  ))}
                </select>
                <select
                  value={skillInput.proficiencyLevel}
                  onChange={e => setSkillInput({ ...skillInput, proficiencyLevel: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition"
                >
                  <Plus size={14} /> Add
                </button>
              </form>
            </div>

            {(!profile?.skills || profile.skills.length === 0) ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <Code2 size={36} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No skills added yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Select skills from the catalog or upload your resume to auto-detect tech competencies.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {profile.skills.map(s => (
                  <div
                    key={s.skill_id || s.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
                  >
                    <span>{s.canonical_name || s.name}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      s.proficiency_level === 'expert' ? 'bg-indigo-100 text-indigo-700' :
                      s.proficiency_level === 'intermediate' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {s.proficiency_level || 'intermediate'}
                    </span>
                    <button
                      onClick={() => handleRemoveSkill(s.skill_id || s.id)}
                      className="text-slate-400 hover:text-rose-600 transition ml-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: Projects */}
        {activeTab === 'projects' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Project Showcases</h2>
                <p className="text-xs text-slate-500 mt-0.5">Showcase your applications, systems, and technical repositories.</p>
              </div>
              <button
                onClick={() => setShowProjModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition"
              >
                <Plus size={15} /> Add Project
              </button>
            </div>

            {(!profile?.projects || profile.projects.length === 0) ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <FolderGit2 size={36} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No projects added yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Add your capstone, hackathon, or open-source projects with working links.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.projects.map(proj => (
                  <div key={proj.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-slate-900 text-base">{proj.title}</h3>
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3">{proj.description}</p>
                      
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {proj.technologies.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-200 text-xs">
                      {proj.github_url && (
                        <a href={proj.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-700 hover:text-indigo-600 font-semibold">
                          <Github size={13} /> Source Code
                        </a>
                      )}
                      {proj.project_url && (
                        <a href={proj.project_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold">
                          <ExternalLink size={13} /> Live Preview
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: Certifications */}
        {activeTab === 'certifications' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Certifications & Credentials</h2>
                <p className="text-xs text-slate-500 mt-0.5">Verified certificates from AWS, Google Cloud, Microsoft, Coursera, etc.</p>
              </div>
              <button
                onClick={() => setShowCertModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition"
              >
                <Plus size={15} /> Add Certification
              </button>
            </div>

            {(!profile?.certifications || profile.certifications.length === 0) ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <Award size={36} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No certifications recorded yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Add certifications to prove proficiency and boost your profile completeness score.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.certifications.map(cert => (
                  <div key={cert.id} className="flex items-start justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{cert.title}</h3>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">{cert.issuing_organization}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span>Issued: {cert.issue_date}</span>
                        {cert.credential_id && <span>• ID: {cert.credential_id}</span>}
                        {cert.credential_url && (
                          <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                            Verify <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCertification(cert.id)}
                      className="text-slate-400 hover:text-rose-600 p-2 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: Resume & AI Parser */}
        {activeTab === 'resume' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Resume Upload & Skill Suggestion Engine</h2>
            <p className="text-xs text-slate-500 mb-6">
              Upload your PDF or DOCX resume. Our parser inspects file magic bytes for security and extracts skills directly into your profile.
            </p>

            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-8 text-center transition bg-slate-50/50">
              <Upload size={36} className="mx-auto text-indigo-600 mb-3" />
              <p className="text-sm font-bold text-slate-800">Select your Resume file to upload</p>
              <p className="text-xs text-slate-500 mt-1">Accepted: PDF or DOCX (Max 5 MB). File signatures are cryptographically checked.</p>

              <label className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer shadow-sm">
                <FileText size={15} />
                {uploadingResume ? 'Verifying & Parsing...' : 'Choose File'}
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleResumeUpload}
                  disabled={uploadingResume}
                  className="hidden"
                />
              </label>
            </div>

            {/* Resume Analysis Output */}
            {resumeAnalysis && (
              <div className="mt-8 p-6 rounded-2xl bg-indigo-50/50 border border-indigo-200/80">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Analysis Results: {resumeAnalysis.fileName}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold">
                    ATS Score: {resumeAnalysis.atsScore} / 100
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-4">{resumeAnalysis.feedback}</p>

                {resumeAnalysis.detectedSkills && resumeAnalysis.detectedSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Auto-Detected Competencies ({resumeAnalysis.detectedSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {resumeAnalysis.detectedSkills.map(skill => (
                        <span
                          key={skill.id}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-medium text-slate-800"
                        >
                          <Check size={12} className="text-emerald-600" />
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal: Add Education */}
      {showEduModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Academic Degree</h3>
            <form onSubmit={handleAddEducation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University Institute of Technology"
                  value={eduForm.institution}
                  onChange={e => setEduForm({ ...eduForm, institution: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Degree Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master of Computer Applications (MCA)"
                  value={eduForm.degree}
                  onChange={e => setEduForm({ ...eduForm, degree: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Year</label>
                  <input
                    type="number"
                    value={eduForm.start_year}
                    onChange={e => setEduForm({ ...eduForm, start_year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Year</label>
                  <input
                    type="number"
                    value={eduForm.end_year}
                    onChange={e => setEduForm({ ...eduForm, end_year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CGPA or Percentage</label>
                <input
                  type="text"
                  placeholder="e.g. 8.9 / 10"
                  value={eduForm.grade_or_cgpa}
                  onChange={e => setEduForm({ ...eduForm, grade_or_cgpa: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEduModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Save Degree
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Project */}
      {showProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Project Showcase</h3>
            <form onSubmit={handleAddProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real-Time Distributed Task Scheduler"
                  value={projForm.title}
                  onChange={e => setProjForm({ ...projForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe problem solved, architecture, and impact..."
                  value={projForm.description}
                  onChange={e => setProjForm({ ...projForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Redis, Docker"
                  value={projForm.technologies}
                  onChange={e => setProjForm({ ...projForm, technologies: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GitHub Repo URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={projForm.github_url}
                  onChange={e => setProjForm({ ...projForm, github_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProjModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Certification */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Certification</h3>
            <form onSubmit={handleAddCertification} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Certification Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Cloud Practitioner"
                  value={certForm.title}
                  onChange={e => setCertForm({ ...certForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issuing Organization</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Web Services (AWS)"
                  value={certForm.issuing_organization}
                  onChange={e => setCertForm({ ...certForm, issuing_organization: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Date</label>
                <input
                  type="date"
                  required
                  value={certForm.issue_date}
                  onChange={e => setCertForm({ ...certForm, issue_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credential ID (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AWS-CCP-109283"
                  value={certForm.credential_id}
                  onChange={e => setCertForm({ ...certForm, credential_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Save Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

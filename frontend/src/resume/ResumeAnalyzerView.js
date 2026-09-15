// frontend/src/resume/ResumeAnalyzerView.js
import React, { useState } from 'react';
import { resumeService } from '../services/apiService';
import { FileText, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export function ResumeAnalyzerView() {
  const [text, setText] = useState('');
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await resumeService.analyze(text, targetRole);
      setAnalysis(res.data?.analysis || res.data);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <FileText className="w-6 h-6 text-indigo-600" />
        ATS Resume Intelligence & Diagnostic
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Job Role</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800 dark:text-white"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resume Text or Content</label>
          <textarea
            rows={6}
            className="w-full px-4 py-2 border rounded-lg font-mono text-sm dark:bg-slate-800 dark:text-white"
            placeholder="Paste your plain resume text or sections here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Evaluating...' : 'Run ATS Diagnostic'}
        </button>

        {analysis && (
          <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900 dark:text-white">Calculated ATS Score</span>
              <span className="text-2xl font-extrabold text-indigo-600">{analysis.atsScore || 75}/100</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{analysis.feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeAnalyzerView;

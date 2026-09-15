// frontend/src/applications/ApplicationTracker.js
import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const STAGE_CONFIG = {
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
  shortlisted: { label: 'Shortlisted', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: CheckCircle },
  interview: { label: 'Interview', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', icon: AlertCircle },
  selected: { label: 'Selected / Offer', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
  rejected: { label: 'Not Selected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle }
};

export function ApplicationTracker({ applications = [] }) {
  if (!applications.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No active applications submitted yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => {
        const stage = STAGE_CONFIG[app.status] || STAGE_CONFIG.applied;
        const Icon = stage.icon;
        return (
          <div key={app.id} className="p-4 border rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{app.job_title || 'Position Applied'}</h4>
              <p className="text-sm text-gray-500">{app.company_name || 'Hiring Company'}</p>
              <div className="mt-1 text-xs text-gray-400">Applied on: {new Date(app.created_at || Date.now()).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${stage.color}`}>
                <Icon className="w-3.5 h-3.5 mr-1" />
                {stage.label}
              </span>
              {app.match_score && (
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                  {Math.round(app.match_score)}% Match
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ApplicationTracker;

// frontend/src/notifications/NotificationCenter.js
import React, { useState } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';

export function NotificationCenter({ notifications = [], onClear, onDismiss }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-4 z-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h4>
            {notifications.length > 0 && onClear && (
              <button onClick={onClear} className="text-xs text-indigo-600 hover:underline">
                Clear all
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No new notifications</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map((item, i) => (
                <div key={i} className="text-xs p-2 rounded bg-slate-50 dark:bg-slate-800 flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">{item.title}</div>
                    <div className="text-gray-500 mt-0.5">{item.message}</div>
                  </div>
                  {onDismiss && (
                    <button onClick={() => onDismiss(item.id)} className="text-gray-400 hover:text-gray-600 ml-2">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;

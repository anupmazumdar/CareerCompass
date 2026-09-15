// frontend/src/matching/MatchScoreBadge.js
import React from 'react';

export function MatchScoreBadge({ score, showLabel = true, size = 'md' }) {
  const numScore = Math.round(Number(score) || 0);

  let colorClasses = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300';
  let label = 'Low Match';

  if (numScore >= 80) {
    colorClasses = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300';
    label = 'Strong Match';
  } else if (numScore >= 60) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
    label = 'Good Match';
  } else if (numScore >= 40) {
    colorClasses = 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300';
    label = 'Partial Match';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-4 py-2 text-base font-bold' : 'px-2.5 py-1 text-sm font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses}`}>
      <span>{numScore}%</span>
      {showLabel && <span className="opacity-80">({label})</span>}
    </span>
  );
}

export default MatchScoreBadge;

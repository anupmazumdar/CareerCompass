// frontend/src/skills/SkillBadgeList.js
import React from 'react';

export function SkillBadgeList({ skills = [], maxDisplay = 6 }) {
  if (!Array.isArray(skills) || skills.length === 0) return null;

  const displaySkills = skills.slice(0, maxDisplay);
  const remaining = skills.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {displaySkills.map((skill, idx) => {
        const name = typeof skill === 'string' ? skill : skill.name || skill.canonical_name;
        return (
          <span
            key={idx}
            className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700"
          >
            {name}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="text-xs text-slate-400 font-medium">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

export default SkillBadgeList;

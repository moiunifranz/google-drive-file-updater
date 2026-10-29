import React from 'react';

export function ProgressBar({ progress, label, showPercent = true, color = 'bg-blue-600', height = 'h-2' }) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress || 0)));

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 mb-1">
          <span>{label}</span>
          {showPercent && <span className="font-semibold">{clampedProgress}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden ${height} border border-slate-200 dark:border-slate-600`}>
        <div
          className={`${color} h-full transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

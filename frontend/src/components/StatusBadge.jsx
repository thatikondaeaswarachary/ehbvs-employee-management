import React from 'react';

const BADGE_STYLES = {
  // Attendance
  Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Half Day': 'bg-amber-50 text-amber-700 border-amber-200',
  Absent: 'bg-rose-50 text-rose-700 border-rose-200',
  Leave: 'bg-purple-50 text-purple-700 border-purple-200',
  Holiday: 'bg-blue-50 text-blue-700 border-blue-200',

  // Work presence
  Working: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Break: 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Offline: 'bg-slate-100 text-slate-600 border-slate-200',

  // Task status
  'Not Started': 'bg-slate-100 text-slate-700 border-slate-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',

  // Leave status
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',

  // Priority
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
  Medium: 'bg-sky-50 text-sky-700 border-sky-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Urgent: 'bg-rose-50 text-rose-700 border-rose-200',

  // Account
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Disabled: 'bg-slate-100 text-slate-600 border-slate-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200'
};

const DOT_COLORS = {
  Working: 'bg-emerald-500 animate-pulse',
  Present: 'bg-emerald-500',
  Break: 'bg-amber-500',
  Completed: 'bg-indigo-500',
  Offline: 'bg-slate-400',
  Urgent: 'bg-rose-500 animate-ping',
  Pending: 'bg-amber-500',
  Approved: 'bg-emerald-500',
  Rejected: 'bg-rose-500'
};

export default function StatusBadge({ status, showDot = false, className = '' }) {
  const label = status || 'Unknown';
  const style = BADGE_STYLES[label] || 'bg-slate-100 text-slate-600 border-slate-200';
  const dotColor = DOT_COLORS[label] || 'bg-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      )}
      {label}
    </span>
  );
}

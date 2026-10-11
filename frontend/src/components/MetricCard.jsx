import React from 'react';

const COLOR_VARIANTS = {
  navy: {
    bg: 'bg-slate-900 text-white',
    iconBg: 'bg-white/10 text-white',
    sub: 'text-slate-300'
  },
  blue: {
    bg: 'bg-white text-slate-900 border border-slate-200/80 shadow-xs',
    iconBg: 'bg-blue-50 text-blue-600',
    sub: 'text-slate-500'
  },
  emerald: {
    bg: 'bg-white text-slate-900 border border-slate-200/80 shadow-xs',
    iconBg: 'bg-emerald-50 text-emerald-600',
    sub: 'text-slate-500'
  },
  amber: {
    bg: 'bg-white text-slate-900 border border-slate-200/80 shadow-xs',
    iconBg: 'bg-amber-50 text-amber-600',
    sub: 'text-slate-500'
  },
  rose: {
    bg: 'bg-white text-slate-900 border border-slate-200/80 shadow-xs',
    iconBg: 'bg-rose-50 text-rose-600',
    sub: 'text-slate-500'
  },
  purple: {
    bg: 'bg-white text-slate-900 border border-slate-200/80 shadow-xs',
    iconBg: 'bg-purple-50 text-purple-600',
    sub: 'text-slate-500'
  }
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  className = ''
}) {
  const styles = COLOR_VARIANTS[color] || COLOR_VARIANTS.blue;

  return (
    <div className={`relative overflow-hidden rounded-xl p-5 transition-all hover:shadow-md ${styles.bg} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className={`text-xs font-semibold uppercase tracking-wider ${styles.sub}`}>
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">
              {value ?? 0}
            </span>
            {trend && (
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`text-xs ${styles.sub}`}>{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl flex items-center justify-center ${styles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}

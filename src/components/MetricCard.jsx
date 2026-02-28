import GoalBadge from './GoalBadge';

/**
 * A single KPI card.
 *
 * Props:
 *   label       — metric name
 *   value       — formatted primary value (string)
 *   change      — { value, pct, positive } from formatChange(), optional
 *   onTrack     — boolean or null
 *   accent      — hex color string for the left border accent
 *   subLabel    — small text below the value, optional
 *   goal        — formatted goal string, optional
 */
export default function MetricCard({ label, value, change, onTrack, accent, subLabel, goal }) {
  return (
    <div
      className="relative flex flex-col gap-2 rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700 shadow-md overflow-hidden"
      style={{ borderLeft: `3px solid ${accent ?? '#3B82F6'}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <GoalBadge onTrack={onTrack} />
      </div>

      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-slate-100 leading-none">{value}</span>
        {change && (
          <span
            className={`mb-0.5 text-sm font-medium ${
              change.positive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {change.value}
            {change.pct && (
              <span className="ml-1 text-xs opacity-75">({change.pct})</span>
            )}
          </span>
        )}
      </div>

      {subLabel && (
        <p className="text-xs text-slate-500">{subLabel}</p>
      )}

      {goal && (
        <p className="text-xs text-slate-500">
          Monthly goal: <span className="text-slate-400 font-medium">{goal}</span>
        </p>
      )}
    </div>
  );
}

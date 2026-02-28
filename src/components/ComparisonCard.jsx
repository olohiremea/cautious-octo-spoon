import GoalBadge from './GoalBadge';

/**
 * Side-by-side comparison card for the Unified View.
 *
 * Props:
 *   label         — metric name
 *   adamValue     — formatted string
 *   choreValue    — formatted string
 *   adamOnTrack   — boolean or null
 *   choreOnTrack  — boolean or null
 *   adamSub       — optional sub-text for Adam
 *   choreSub      — optional sub-text for Chore
 */
export default function ComparisonCard({
  label,
  adamValue,
  choreValue,
  adamOnTrack,
  choreOnTrack,
  adamSub,
  choreSub,
}) {
  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 shadow-md overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-700 bg-slate-800/70">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-slate-700">
        {/* Adam */}
        <div className="p-4 flex flex-col gap-1.5" style={{ borderTop: '2px solid #3B82F6' }}>
          <span className="text-xs font-medium text-blue-400">Adam</span>
          <span className="text-2xl font-bold text-slate-100 leading-none">{adamValue}</span>
          {adamSub && <span className="text-xs text-slate-500">{adamSub}</span>}
          <GoalBadge onTrack={adamOnTrack} />
        </div>
        {/* Chore */}
        <div className="p-4 flex flex-col gap-1.5" style={{ borderTop: '2px solid #8B5CF6' }}>
          <span className="text-xs font-medium text-violet-400">Chore</span>
          <span className="text-2xl font-bold text-slate-100 leading-none">{choreValue}</span>
          {choreSub && <span className="text-xs text-slate-500">{choreSub}</span>}
          <GoalBadge onTrack={choreOnTrack} />
        </div>
      </div>
    </div>
  );
}

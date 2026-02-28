export default function GoalBadge({ onTrack }) {
  if (onTrack === null || onTrack === undefined) return null;

  return onTrack ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      On Track
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/30">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      Off Track
    </span>
  );
}

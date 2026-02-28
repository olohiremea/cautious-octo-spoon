/**
 * A simple circular progress ring that shows the account health score (0-100).
 */
export default function HealthScoreRing({ score, color, label }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const ringColor =
    score >= 80 ? '#10B981' :
    score >= 50 ? '#F59E0B' :
    '#EF4444';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={90} height={90} className="-rotate-90">
          <circle
            cx={45}
            cy={45}
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth={7}
          />
          <circle
            cx={45}
            cy={45}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={7}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-100">{score}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-300" style={{ color }}>{label}</p>
        <p className="text-xs text-slate-500">Health Score</p>
      </div>
    </div>
  );
}

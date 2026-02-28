import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { formatWeekLabel } from '../utils/dataHelpers';

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-slate-900 ring-1 ring-slate-600 p-3 shadow-xl text-xs">
      <p className="mb-1.5 font-semibold text-slate-300">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="leading-5">
          {entry.name}: <span className="font-bold">{entry.value}%</span>
        </p>
      ))}
    </div>
  );
}

export default function EngagementChart({ weeklyData, color, goalRate, label = 'Engagement Rate' }) {
  const chartData = weeklyData.map((row) => ({
    week: formatWeekLabel(row.Week),
    'Eng. Rate': row.Engagement_Rate,
  }));

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 shadow-md">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">Engagement Rate Trend (12 weeks)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={44}
          />
          <Tooltip content={<DarkTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
          {goalRate != null && (
            <ReferenceLine
              y={goalRate}
              stroke="#10B981"
              strokeDasharray="6 3"
              label={{ value: `Goal ${goalRate}%`, fill: '#10B981', fontSize: 10, position: 'insideTopRight' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="Eng. Rate"
            name={label}
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

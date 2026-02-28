import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatWeekLabel, formatNumber } from '../utils/dataHelpers';

const CHART_COLORS = {
  adam: '#3B82F6',
  chore: '#8B5CF6',
};

/** Shared dark-theme tooltip */
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-slate-900 ring-1 ring-slate-600 p-3 shadow-xl text-xs">
      <p className="mb-1.5 font-semibold text-slate-300">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="leading-5">
          {entry.name}: <span className="font-bold">{formatNumber(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * Single-account follower line chart (used inside individual account tabs).
 */
export function SingleFollowerChart({ weeklyData, color, label }) {
  const chartData = weeklyData.map((row) => ({
    week: formatWeekLabel(row.Week),
    Followers: row.Followers,
  }));

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 shadow-md">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">Follower Growth (12 weeks)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatNumber}
            width={52}
          />
          <Tooltip content={<DarkTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
          <Line
            type="monotone"
            dataKey="Followers"
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

/**
 * Combined follower growth chart showing both Adam + Chore on the same axes.
 */
export function CombinedFollowerChart({ adamWeekly, choreWeekly }) {
  // Merge by week label
  const adamMap = Object.fromEntries(
    adamWeekly.map((r) => [r.Week, r.Followers])
  );
  const choreMap = Object.fromEntries(
    choreWeekly.map((r) => [r.Week, r.Followers])
  );
  const allWeeks = [...new Set([...adamWeekly.map((r) => r.Week), ...choreWeekly.map((r) => r.Week)])].sort();

  const chartData = allWeeks.map((w) => ({
    week: formatWeekLabel(w),
    Adam: adamMap[w] ?? null,
    Chore: choreMap[w] ?? null,
  }));

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 shadow-md">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">
        Follower Growth — Adam vs Chore (12 weeks)
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatNumber}
            width={56}
          />
          <Tooltip content={<DarkTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
          <Line
            type="monotone"
            dataKey="Adam"
            stroke={CHART_COLORS.adam}
            strokeWidth={2.5}
            dot={{ r: 3, fill: CHART_COLORS.adam, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="Chore"
            stroke={CHART_COLORS.chore}
            strokeWidth={2.5}
            dot={{ r: 3, fill: CHART_COLORS.chore, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

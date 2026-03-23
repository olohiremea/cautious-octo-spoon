import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatWeekLabel, formatNumber } from '../utils/dataHelpers';

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

export default function ImpressionsChart({
  weeklyData,
  color,
  label = 'Impressions',
  dataKey = 'Impressions',
}) {
  const chartData = weeklyData.map((row) => ({
    week: formatWeekLabel(row.Week),
    value: row[dataKey],
  }));

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 shadow-md">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">Weekly {label}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatNumber}
            width={52}
          />
          <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
          <Bar dataKey="value" name={label} fill={color} radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

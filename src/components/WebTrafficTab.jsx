import useGA4Data from '../hooks/useGA4Data';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorState from './ErrorState';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function pctChange(current, previous) {
  if (!previous) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return pct.toFixed(1);
}

function shortDate(iso) {
  // "2026-02-14" → "Feb 14"
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, prevValue, color = 'text-emerald-400' }) {
  const pct = pctChange(value, prevValue);
  const positive = pct !== null && parseFloat(pct) >= 0;
  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`text-3xl font-bold ${color}`}>{fmt(value)}</span>
      {pct !== null && (
        <span className={`text-xs font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {positive ? '+' : ''}{pct}% vs prev month
        </span>
      )}
    </div>
  );
}

function SessionsChart({ byDate }) {
  if (!byDate?.length) return <p className="text-slate-500 text-sm py-8 text-center">No data for this period.</p>;
  const chartData = byDate.map((r) => ({ date: shortDate(r.date), sessions: r.sessions }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={40} tickFormatter={fmt} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
          itemStyle={{ color: '#34d399' }}
        />
        <Line type="monotone" dataKey="sessions" stroke="#34d399" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SourceChart({ bySource }) {
  if (!bySource?.length) return <p className="text-slate-500 text-sm py-8 text-center">No source data.</p>;

  // Capitalize source names nicely
  const data = bySource.map((r) => ({
    source: r.source.charAt(0).toUpperCase() + r.source.slice(1),
    sessions: r.sessions,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmt} />
        <YAxis type="category" dataKey="source" tick={{ fontSize: 12, fill: '#cbd5e1' }} width={90} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
          itemStyle={{ color: '#34d399' }}
        />
        <Bar dataKey="sessions" fill="#34d399" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WebTrafficTab({ year, month }) {
  const { data, loading, error, refresh } = useGA4Data(year, month);

  if (loading) return <LoadingSkeleton />;

  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const { totals, prevTotals, byDate, bySource } = data;
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Website Traffic · Organic Social</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            GA4 · {monthLabel} · Sessions driven by organic social channels
          </p>
        </div>
        <button
          onClick={refresh}
          className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 ring-1 ring-slate-700 rounded-lg px-3 py-1.5 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Sessions"   value={totals.sessions}  prevValue={prevTotals?.sessions}  />
        <MetricCard label="Users"      value={totals.users}     prevValue={prevTotals?.users}     />
        <MetricCard label="Page Views" value={totals.pageViews} prevValue={prevTotals?.pageViews} />
      </div>

      {/* Sessions over time */}
      <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Sessions Over Time</h3>
        <SessionsChart byDate={byDate} />
      </div>

      {/* Top sources */}
      <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Top Organic Social Sources</h3>
        <SourceChart bySource={bySource} />
      </div>
    </div>
  );
}

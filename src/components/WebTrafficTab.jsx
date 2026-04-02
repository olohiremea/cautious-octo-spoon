import useGA4Data from '../hooks/useGA4Data';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorState from './ErrorState';
import GoalBadge from './GoalBadge';
import HealthScoreRing from './HealthScoreRing';
import { findGoal, isOnTrack, formatNumber, calculateHealthScore } from '../utils/dataHelpers';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Channel colours
const COLORS = {
  organicSocial: '#34d399', // emerald
  direct:        '#60a5fa', // blue
  organicSearch: '#fbbf24', // amber
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function pctChange(current, previous) {
  if (!previous) return null;
  return (((current - previous) / Math.abs(previous)) * 100).toFixed(1);
}

function shortDate(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}`;
}

/** Collapse daily rows into weekly buckets (week 1 = days 1-7, etc.) */
function toWeekly(combinedByDate) {
  const weeks = {};
  for (const row of combinedByDate) {
    const day = parseInt(row.date.split('-')[2], 10);
    const label = `Wk ${Math.floor((day - 1) / 7) + 1}`;
    if (!weeks[label]) {
      weeks[label] = { week: label, organicSocial: 0, direct: 0, organicSearch: 0 };
    }
    weeks[label].organicSocial += row.organicSocial;
    weeks[label].direct        += row.direct;
    weeks[label].organicSearch += row.organicSearch;
  }
  return Object.values(weeks);
}

const DEMO_ORANGE = '#f97316';

// ── Sub-components ────────────────────────────────────────────────────────────

function TrafficFunnel({ funnelData }) {
  if (!funnelData) return null;
  const { totalSessions, demoSessions, byChannel } = funnelData;
  const cvr = totalSessions > 0 ? (demoSessions / totalSessions) * 100 : 0;
  // Clamp demo bar width: proportional to CVR but never thinner than 20% or wider than 100%
  const demoWidthPct = totalSessions > 0 ? Math.max(20, Math.min(100, (demoSessions / totalSessions) * 100)) : 20;

  return (
    <div className="space-y-5">
      {/* ── Two-step funnel ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center">
        {/* Step 1 — All Traffic */}
        <div className="w-full rounded-xl bg-slate-700/60 ring-1 ring-slate-600 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-100">All Traffic</p>
            <p className="text-xs text-slate-400 mt-0.5">Organic Social · Direct · Organic Search</p>
          </div>
          <span className="text-2xl font-bold text-slate-100 tabular-nums">{fmt(totalSessions)}</span>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center gap-1 py-2 text-slate-400">
          <div className="w-px h-3 bg-slate-600" />
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 ring-1 ring-slate-600">
            {cvr.toFixed(1)}% reached demo
          </span>
          <div className="w-px h-3 bg-slate-600" />
        </div>

        {/* Step 2 — Demo page */}
        <div
          className="rounded-xl px-6 py-4 flex items-center justify-between gap-4 transition-[width] duration-500"
          style={{ width: `${demoWidthPct}%`, minWidth: '200px', backgroundColor: DEMO_ORANGE }}
        >
          <div>
            <p className="text-sm font-semibold text-white">Book a Demo</p>
            <p className="text-xs text-orange-200 mt-0.5">hirechore.com/demo</p>
          </div>
          <span className="text-2xl font-bold text-white tabular-nums">{fmt(demoSessions)}</span>
        </div>
      </div>

      {/* ── Per-channel conversion breakdown ───────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conversion by Channel</p>
        {byChannel.map(({ channel, color, sessions, demoSessions: demoCh }) => {
          const chCvr = sessions > 0 ? (demoCh / sessions) * 100 : 0;
          return (
            <div key={channel} className="rounded-lg bg-slate-800 ring-1 ring-slate-700 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-slate-200">{channel}</span>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-slate-100">{fmt(demoCh)}</span>
                  <span className="text-slate-500"> demo · </span>
                  <span className="font-semibold" style={{ color }}>{chCvr.toFixed(1)}% CVR</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, chCvr)}%`, backgroundColor: color, opacity: 0.85 }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-20 text-right tabular-nums">{fmt(sessions)} sessions</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function MetricCard({ label, value, prevValue, color = COLORS.organicSocial, goal, onTrack }) {
  const pct = pctChange(value, prevValue);
  const positive = pct !== null && parseFloat(pct) >= 0;
  return (
    <div
      className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 flex flex-col gap-2"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
        <GoalBadge onTrack={onTrack} />
      </div>
      <span className="text-3xl font-bold text-slate-100 leading-none">{fmt(value)}</span>
      {pct !== null && (
        <span className={`text-xs font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {positive ? '+' : ''}{pct}% vs prev month
        </span>
      )}
      {goal != null && (
        <p className="text-xs text-slate-500">
          Monthly goal: <span className="text-slate-400 font-medium">{formatNumber(goal)}</span>
        </p>
      )}
    </div>
  );
}

function ChannelSection({ title, color, data, usersGoal, usersOnTrack }) {
  const { totals, prevTotals } = data;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold" style={{ color }}>{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Sessions"   value={totals.sessions}  prevValue={prevTotals?.sessions}  color={color} />
        <MetricCard label="Users"      value={totals.users}     prevValue={prevTotals?.users}      color={color} goal={usersGoal} onTrack={usersOnTrack} />
        <MetricCard label="Page Views" value={totals.pageViews} prevValue={prevTotals?.pageViews}  color={color} />
      </div>
    </div>
  );
}

function WeeklyTrafficChart({ combinedByDate }) {
  if (!combinedByDate?.length) {
    return <p className="text-slate-500 text-sm py-8 text-center">No data for this period.</p>;
  }
  const data = toWeekly(combinedByDate);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={44} tickFormatter={fmt} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
        <Line
          type="monotone"
          dataKey="organicSocial"
          name="Organic Social"
          stroke={COLORS.organicSocial}
          strokeWidth={2}
          dot={{ r: 4, fill: COLORS.organicSocial }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="direct"
          name="Direct"
          stroke={COLORS.direct}
          strokeWidth={2}
          dot={{ r: 4, fill: COLORS.direct }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="organicSearch"
          name="Organic Search"
          stroke={COLORS.organicSearch}
          strokeWidth={2}
          dot={{ r: 4, fill: COLORS.organicSearch }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SourceChart({ bySource }) {
  if (!bySource?.length) return <p className="text-slate-500 text-sm py-8 text-center">No source data.</p>;
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
          itemStyle={{ color: COLORS.organicSocial }}
        />
        <Bar dataKey="sessions" fill={COLORS.organicSocial} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WebTrafficTab({ year, month, goals = [] }) {
  const { data, loading, error, refresh } = useGA4Data(year, month);

  if (loading) return <LoadingSkeleton />;
  if (error)   return <ErrorState message={error} onRetry={refresh} />;

  const { organicSocial, direct, organicSearch, combinedByDate, bySource, funnelData } = data;
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

  const goalOrgSocial = findGoal(goals, 'Website', 'Organic_Social_Users');
  const goalDirect    = findGoal(goals, 'Website', 'Direct_Users');
  const goalOrgSearch = findGoal(goals, 'Website', 'Organic_Search_Users');

  const orgSocialOT = isOnTrack(organicSocial.totals.users, goalOrgSocial, year, month);
  const directOT    = isOnTrack(direct.totals.users,        goalDirect,    year, month);
  const orgSearchOT = isOnTrack(organicSearch.totals.users, goalOrgSearch, year, month);

  const healthScore = calculateHealthScore([orgSocialOT, directOT, orgSearchOT]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Website Traffic</h2>
          <p className="text-xs text-slate-500 mt-0.5">GA4 · {monthLabel} · Organic Social, Direct &amp; Organic Search</p>
        </div>
        <div className="flex items-center gap-4">
          {healthScore !== null && (
            <HealthScoreRing score={healthScore} color="#06b6d4" label="Website" />
          )}
          <button
            onClick={refresh}
            className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 ring-1 ring-slate-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Conversion funnel — traffic sources → /demo */}
      <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Traffic → Demo Conversion Funnel</h3>
        <TrafficFunnel funnelData={funnelData} />
      </div>

      {/* Week-on-week traffic chart (all 3 channels) */}
      <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Sessions by Week — All Channels</h3>
        <WeeklyTrafficChart combinedByDate={combinedByDate} />
      </div>

      {/* Per-channel metric cards */}
      <div className="space-y-6">
        <ChannelSection title="Organic Social"  color={COLORS.organicSocial} data={organicSocial} usersGoal={goalOrgSocial} usersOnTrack={orgSocialOT} />
        <ChannelSection title="Direct"          color={COLORS.direct}        data={direct}         usersGoal={goalDirect}    usersOnTrack={directOT} />
        <ChannelSection title="Organic Search"  color={COLORS.organicSearch} data={organicSearch}  usersGoal={goalOrgSearch} usersOnTrack={orgSearchOT} />
      </div>

      {/* Top organic-social sources */}
      <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Top Organic Social Sources</h3>
        <SourceChart bySource={bySource} />
      </div>
    </div>
  );
}

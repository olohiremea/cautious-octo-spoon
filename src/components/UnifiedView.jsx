import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import ComparisonCard from './ComparisonCard';
import MetricCard from './MetricCard';
import HealthScoreRing from './HealthScoreRing';
import { CombinedFollowerChart } from './FollowerChart';
import AIInsights from './AIInsights';
import useGA4Data from '../hooks/useGA4Data';
import usePipedriveData from '../hooks/usePipedriveData';
import {
  getFollowerGrowth,
  getTotalImpressions,
  getAvgEngagementRate,
  getTotalPosts,
  getTotalICPConnections,
  getCurrentFollowers,
  isOnTrack,
  findGoal,
  calculateHealthScore,
  formatNumber,
  formatChange,
  filterByMonth,
  formatWeekLabel,
} from '../utils/dataHelpers';

const ADAM_BLUE    = '#3B82F6';
const CHORE_PURPLE = '#8B5CF6';
const SALES_ORANGE = '#f97316';
const WON_GREEN    = '#22c55e';
const GA4_SOCIAL   = '#34d399';
const GA4_DIRECT   = '#60a5fa';
const GA4_SEARCH   = '#fbbf24';

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(current, prev) {
  if (!prev) return null;
  const p = (((current - prev) / Math.abs(prev)) * 100).toFixed(1);
  return { p, positive: parseFloat(p) >= 0 };
}

/** Collapse daily GA4 rows into Wk 1-4 weekly buckets */
function toWeekly(combinedByDate) {
  const weeks = {};
  for (const row of combinedByDate ?? []) {
    const day   = parseInt(row.date.split('-')[2], 10);
    const label = `Wk ${Math.floor((day - 1) / 7) + 1}`;
    if (!weeks[label]) weeks[label] = { week: label, organicSocial: 0, direct: 0, organicSearch: 0 };
    weeks[label].organicSocial += row.organicSocial;
    weeks[label].direct        += row.direct;
    weeks[label].organicSearch += row.organicSearch;
  }
  return Object.values(weeks);
}

/** Parse a raw Week value (GViz "Date(Y,M,D)" or ISO "YYYY-MM-DD") into a Date for sorting */
function parseRawDate(raw) {
  const s = String(raw).trim();
  const gviz = s.match(/^Date\((\d+),(\d+),(\d+)\)$/);
  if (gviz) return new Date(+gviz[1], +gviz[2], +gviz[3]); // month already 0-indexed
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

/** Merge two arrays of weekly LinkedIn rows, sorted chronologically by raw Week date */
function mergeWeeklyRows(adamRows, choreRows) {
  const adamByRaw  = Object.fromEntries(adamRows.map((r)  => [String(r.Week), r]));
  const choreByRaw = Object.fromEntries(choreRows.map((r) => [String(r.Week), r]));

  const allRaws = [...new Set([
    ...adamRows.map((r)  => String(r.Week)),
    ...choreRows.map((r) => String(r.Week)),
  ])].sort((a, b) => parseRawDate(a) - parseRawDate(b));

  return allRaws.map((raw) => {
    const a = adamByRaw[raw];
    const c = choreByRaw[raw];
    return {
      week:    formatWeekLabel(raw),
      adam:    a?.Impressions     ?? 0,
      adamEng: a?.Engagement_Rate ?? 0,
      chore:   c?.Impressions     ?? 0,
      choreEng: c?.Engagement_Rate ?? 0,
    };
  });
}

// ── Shared tooltip ────────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-slate-900 ring-1 ring-slate-600 p-3 shadow-xl text-xs">
      <p className="mb-1.5 font-semibold text-slate-300">{label}</p>
      {payload.map((e) => (
        <p key={e.name} style={{ color: e.color }} className="leading-5">
          {e.name}: <span className="font-bold">{formatter ? formatter(e.value) : formatNumber(e.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ── LinkedIn combined charts ──────────────────────────────────────────────────

function CombinedImpressionsChart({ adamWeekly, choreWeekly, year, month }) {
  const data = useMemo(() => {
    const aRows = filterByMonth(adamWeekly,  year, month);
    const cRows = filterByMonth(choreWeekly, year, month);
    return mergeWeeklyRows(aRows, cRows);
  }, [adamWeekly, choreWeekly, year, month]);

  if (!data.length) return <p className="text-slate-500 text-sm text-center py-6">No impression data for this period.</p>;

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5">
      <h4 className="text-sm font-semibold text-slate-300 mb-4">Weekly Impressions — Adam &amp; Chore</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={44} tickFormatter={formatNumber} tickLine={false} axisLine={false} />
          <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
          <Bar dataKey="adam"  name="Adam"  fill={ADAM_BLUE}    radius={[4, 4, 0, 0]} />
          <Bar dataKey="chore" name="Chore" fill={CHORE_PURPLE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CombinedEngagementChart({ adamWeekly, choreWeekly, year, month }) {
  const data = useMemo(() => {
    const aRows = filterByMonth(adamWeekly,  year, month);
    const cRows = filterByMonth(choreWeekly, year, month);
    return mergeWeeklyRows(aRows, cRows);
  }, [adamWeekly, choreWeekly, year, month]);

  if (!data.length) return <p className="text-slate-500 text-sm text-center py-6">No engagement data for this period.</p>;

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5">
      <h4 className="text-sm font-semibold text-slate-300 mb-4">Weekly Engagement Rate — Adam &amp; Chore</h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip content={<DarkTooltip formatter={(v) => `${v}%`} />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
          <Line type="monotone" dataKey="adamEng"  name="Adam"  stroke={ADAM_BLUE}    strokeWidth={2} dot={{ r: 4, fill: ADAM_BLUE }}    activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="choreEng" name="Chore" stroke={CHORE_PURPLE} strokeWidth={2} dot={{ r: 4, fill: CHORE_PURPLE }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── GA4 weekly multi-channel chart ────────────────────────────────────────────

function GA4WeeklyChart({ combinedByDate }) {
  if (!combinedByDate?.length) return <p className="text-slate-500 text-sm text-center py-6">No data for this period.</p>;
  const data = toWeekly(combinedByDate);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={44} tickFormatter={formatNumber} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
        <Line type="monotone" dataKey="organicSocial" name="Organic Social" stroke={GA4_SOCIAL} strokeWidth={2} dot={{ r: 3, fill: GA4_SOCIAL }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="direct"        name="Direct"         stroke={GA4_DIRECT} strokeWidth={2} dot={{ r: 3, fill: GA4_DIRECT }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="organicSearch" name="Organic Search" stroke={GA4_SEARCH} strokeWidth={2} dot={{ r: 3, fill: GA4_SEARCH }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── GA4 channel metric row ────────────────────────────────────────────────────

function GA4ChannelCard({ label, color, ch }) {
  if (!ch) return null;
  const change = pct(ch.totals.sessions, ch.prevTotals?.sessions);
  return (
    <div
      className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-4 flex flex-col gap-1"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-2xl font-bold text-slate-100">{formatNumber(ch.totals.sessions)}</span>
      <span className="text-xs text-slate-500">sessions</span>
      {change && (
        <span className={`text-xs font-medium ${change.positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {change.positive ? '+' : ''}{change.p}% vs prev month
        </span>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UnifiedView({ adamWeekly, adamMonthly, choreWeekly, choreMonthly, adamPosts, chorePosts, goals, year, month }) {
  const ly = month === 0 ? year - 1 : year;
  const lm = month === 0 ? 11 : month - 1;
  const cy = year;
  const cm = month;

  const { data: ga4Data,        loading: ga4Loading,        error: ga4Error        } = useGA4Data(year, month);
  const { data: pipedriveData,  loading: pipedriveLoading,  error: pipedriveError  } = usePipedriveData(year, month);

  const metrics = useMemo(() => {
    const adamFollowers   = getCurrentFollowers(adamWeekly);
    const adamGrowth      = getFollowerGrowth(adamWeekly, cy, cm);
    const adamImpressions = getTotalImpressions(adamMonthly, cy, cm);
    const adamEngagement  = getAvgEngagementRate(adamMonthly, cy, cm);
    const adamPostCount   = getTotalPosts(adamMonthly, cy, cm);
    const adamICP         = getTotalICPConnections(adamMonthly, cy, cm);

    const choreFollowers   = getCurrentFollowers(choreWeekly);
    const choreGrowth      = getFollowerGrowth(choreWeekly, cy, cm);
    const choreImpressions = getTotalImpressions(choreMonthly, cy, cm);
    const choreEngagement  = getAvgEngagementRate(choreMonthly, cy, cm);

    const adamGoals = {
      growth:      findGoal(goals, 'Adam', 'Followers_Growth'),
      impressions: findGoal(goals, 'Adam', 'Impressions'),
      engagement:  findGoal(goals, 'Adam', 'Engagement_Rate'),
      posts:       findGoal(goals, 'Adam', 'Posts_Published'),
      icp:         findGoal(goals, 'Adam', 'ICP_Connection_Requests'),
    };
    const choreGoals = {
      growth:      findGoal(goals, 'Chore', 'Followers_Growth'),
      impressions: findGoal(goals, 'Chore', 'Impressions'),
      engagement:  findGoal(goals, 'Chore', 'Engagement_Rate'),
    };

    const adamTracking = [
      isOnTrack(adamGrowth,      adamGoals.growth,      cy, cm),
      isOnTrack(adamImpressions, adamGoals.impressions, cy, cm),
      isOnTrack(adamEngagement,  adamGoals.engagement,  cy, cm),
      isOnTrack(adamPostCount,   adamGoals.posts,       cy, cm),
      isOnTrack(adamICP,         adamGoals.icp,         cy, cm),
    ];
    const choreTracking = [
      isOnTrack(choreGrowth,      choreGoals.growth,      cy, cm),
      isOnTrack(choreImpressions, choreGoals.impressions, cy, cm),
      isOnTrack(choreEngagement,  choreGoals.engagement,  cy, cm),
    ];

    return {
      adamFollowers, adamGrowth, adamImpressions, adamEngagement, adamPostCount, adamICP,
      choreFollowers, choreGrowth, choreImpressions, choreEngagement,
      adamGoals, choreGoals,
      adamHealth:  calculateHealthScore(adamTracking),
      choreHealth: calculateHealthScore(choreTracking),
    };
  }, [adamWeekly, adamMonthly, choreWeekly, choreMonthly, goals, cy, cm]);

  const {
    adamFollowers, adamGrowth, adamImpressions, adamEngagement, adamPostCount, adamICP,
    choreFollowers, choreGrowth, choreImpressions, choreEngagement,
    adamGoals, choreGoals, adamHealth, choreHealth,
  } = metrics;

  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header + health scores */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Overview — {monthName}</h2>
          <p className="text-sm text-slate-500 mt-0.5">Side-by-side snapshot of both LinkedIn accounts</p>
        </div>
        <div className="flex gap-8">
          <HealthScoreRing score={adamHealth  ?? 0} color={ADAM_BLUE}    label="Adam"  />
          <HealthScoreRing score={choreHealth ?? 0} color={CHORE_PURPLE} label="Chore" />
        </div>
      </div>

      {/* Comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComparisonCard
          label="Total Followers"
          adamValue={formatNumber(adamFollowers)}
          choreValue={formatNumber(choreFollowers)}
          adamOnTrack={null}
          choreOnTrack={null}
        />
        <ComparisonCard
          label="Follower Growth This Month"
          adamValue={`+${formatNumber(adamGrowth)}`}
          choreValue={`+${formatNumber(choreGrowth)}`}
          adamOnTrack={isOnTrack(adamGrowth, adamGoals.growth, cy, cm)}
          choreOnTrack={isOnTrack(choreGrowth, choreGoals.growth, cy, cm)}
          adamSub={adamGoals.growth ? `Goal: +${formatNumber(adamGoals.growth)}` : null}
          choreSub={choreGoals.growth ? `Goal: +${formatNumber(choreGoals.growth)}` : null}
        />
        <ComparisonCard
          label="Total Impressions This Month"
          adamValue={formatNumber(adamImpressions)}
          choreValue={formatNumber(choreImpressions)}
          adamOnTrack={isOnTrack(adamImpressions, adamGoals.impressions, cy, cm)}
          choreOnTrack={isOnTrack(choreImpressions, choreGoals.impressions, cy, cm)}
          adamSub={adamGoals.impressions ? `Goal: ${formatNumber(adamGoals.impressions)}` : null}
          choreSub={choreGoals.impressions ? `Goal: ${formatNumber(choreGoals.impressions)}` : null}
        />
        <ComparisonCard
          label="Avg. Engagement Rate"
          adamValue={`${adamEngagement}%`}
          choreValue={`${choreEngagement}%`}
          adamOnTrack={isOnTrack(adamEngagement, adamGoals.engagement, cy, cm)}
          choreOnTrack={isOnTrack(choreEngagement, choreGoals.engagement, cy, cm)}
          adamSub={adamGoals.engagement ? `Goal: ${adamGoals.engagement}%` : null}
          choreSub={choreGoals.engagement ? `Goal: ${choreGoals.engagement}%` : null}
        />
        <MetricCard
          label="Adam — Posts Published"
          value={String(adamPostCount)}
          onTrack={isOnTrack(adamPostCount, adamGoals.posts, cy, cm)}
          accent={ADAM_BLUE}
          goal={adamGoals.posts ? `${adamGoals.posts} posts` : null}
          subLabel="Adam only — Chore does not track posts in weekly data"
        />
        <MetricCard
          label="Adam — ICP Connections"
          value={formatNumber(adamICP)}
          onTrack={isOnTrack(adamICP, adamGoals.icp, cy, cm)}
          accent={ADAM_BLUE}
          goal={adamGoals.icp ? formatNumber(adamGoals.icp) : null}
          subLabel="Adam only — this month"
        />
      </div>

      {/* LinkedIn weekly charts */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-300">LinkedIn — Weekly Trends</h3>
          <p className="text-xs text-slate-500 mt-0.5">Follower growth, impressions and engagement rate by week for both accounts</p>
        </div>
        <CombinedFollowerChart adamWeekly={adamWeekly} choreWeekly={choreWeekly} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CombinedImpressionsChart
            adamWeekly={adamWeekly}
            choreWeekly={choreWeekly}
            year={year}
            month={month}
          />
          <CombinedEngagementChart
            adamWeekly={adamWeekly}
            choreWeekly={choreWeekly}
            year={year}
            month={month}
          />
        </div>
      </div>

      {/* Website Traffic — all channels */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-300">Website Traffic</h3>
          <p className="text-xs text-slate-500 mt-0.5">GA4 · Organic Social, Direct &amp; Organic Search</p>
        </div>

        {ga4Loading && (
          <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-6 text-center text-sm text-slate-500">
            Loading GA4 data…
          </div>
        )}

        {!ga4Loading && ga4Error && (
          <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-4 text-sm text-red-400">
            {ga4Error}
          </div>
        )}

        {!ga4Loading && ga4Data && (
          <>
            {/* Per-channel sessions summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <GA4ChannelCard label="Organic Social"  color={GA4_SOCIAL} ch={ga4Data.organicSocial} />
              <GA4ChannelCard label="Direct"          color={GA4_DIRECT} ch={ga4Data.direct} />
              <GA4ChannelCard label="Organic Search"  color={GA4_SEARCH} ch={ga4Data.organicSearch} />
            </div>

            {/* Week-on-week sessions chart */}
            <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5">
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Sessions by Week — All Channels</h4>
              <GA4WeeklyChart combinedByDate={ga4Data.combinedByDate} />
            </div>
          </>
        )}
      </div>

      {/* Sales — Pipedrive */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-300">Sales</h3>
          <p className="text-xs text-slate-500 mt-0.5">Pipedrive CRM · Inbound leads, calls and conversions</p>
        </div>

        {pipedriveLoading && (
          <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-6 text-center text-sm text-slate-500">
            Loading Pipedrive data…
          </div>
        )}

        {!pipedriveLoading && pipedriveError && (
          <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-4 text-sm text-red-400">
            {pipedriveError}
          </div>
        )}

        {!pipedriveLoading && pipedriveData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-4 flex flex-col gap-1 shadow-md"
              style={{ borderLeft: `3px solid ${SALES_ORANGE}` }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inbound Leads</span>
              <span className="text-3xl font-bold text-slate-100 leading-none">
                {formatNumber(pipedriveData.leads?.total ?? 0)}
              </span>
              <span className="text-xs text-slate-500">New deals this month</span>
            </div>
            <div
              className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-4 flex flex-col gap-1 shadow-md"
              style={{ borderLeft: `3px solid ${SALES_ORANGE}` }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Calls Held</span>
              <span className="text-3xl font-bold text-slate-100 leading-none">
                {formatNumber(pipedriveData.calls?.held ?? 0)}
              </span>
              <span className="text-xs text-slate-500">Completed call activities</span>
            </div>
            <div
              className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-4 flex flex-col gap-1 shadow-md"
              style={{ borderLeft: `3px solid ${WON_GREEN}` }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Conversions</span>
              <span className="text-3xl font-bold text-slate-100 leading-none">
                {formatNumber(pipedriveData.conversions?.won ?? 0)}
              </span>
              <span className="text-xs text-slate-500">Deals won this month</span>
            </div>
            <div
              className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-4 flex flex-col gap-1 shadow-md"
              style={{ borderLeft: `3px solid ${WON_GREEN}` }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Conversion Rate</span>
              <span className="text-3xl font-bold text-slate-100 leading-none">
                {pipedriveData.conversions?.conversionRate != null
                  ? `${pipedriveData.conversions.conversionRate}%`
                  : '—'}
              </span>
              <span className="text-xs text-slate-500">Won / new leads</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights */}
      <AIInsights
        adamPosts={adamPosts}
        chorePosts={chorePosts}
        adamMonthly={adamMonthly}
        choreMonthly={choreMonthly}
        goals={goals}
        year={year}
        month={month}
      />
    </div>
  );
}

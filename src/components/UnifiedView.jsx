import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ComparisonCard from './ComparisonCard';
import MetricCard from './MetricCard';
import HealthScoreRing from './HealthScoreRing';
import { CombinedFollowerChart } from './FollowerChart';
import AIInsights from './AIInsights';
import useGA4Data from '../hooks/useGA4Data';
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
} from '../utils/dataHelpers';

const ADAM_BLUE    = '#3B82F6';
const CHORE_PURPLE = '#8B5CF6';
const GA4_GREEN    = '#34d399';

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function GA4SessionsLine({ byDate }) {
  if (!byDate?.length) return <p className="text-slate-500 text-sm text-center py-6">No data for this period.</p>;
  const data = byDate.map((r) => {
    const [, m, d] = r.date.split('-').map(Number);
    return { date: `${MONTH_ABBR[m - 1]} ${d}`, sessions: r.sessions };
  });
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={44} tickFormatter={formatNumber} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
          itemStyle={{ color: GA4_GREEN }}
        />
        <Line type="monotone" dataKey="sessions" stroke={GA4_GREEN} strokeWidth={2} dot={false} name="Sessions" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function UnifiedView({ adamWeekly, adamMonthly, choreWeekly, choreMonthly, adamPosts, chorePosts, goals, year, month }) {
  // Derive "last month" from selected year/month
  const ly = month === 0 ? year - 1 : year;
  const lm = month === 0 ? 11 : month - 1;

  const cy = year;
  const cm = month;

  const { data: ga4Data, loading: ga4Loading, error: ga4Error } = useGA4Data(year, month);

  const metrics = useMemo(() => {
    // ── Adam ───────────────────────────────────────────────────────────────
    const adamFollowers   = getCurrentFollowers(adamWeekly);
    const adamGrowth      = getFollowerGrowth(adamWeekly, cy, cm);
    const adamImpressions = getTotalImpressions(adamMonthly, cy, cm);
    const adamEngagement  = getAvgEngagementRate(adamMonthly, cy, cm);
    const adamPostCount   = getTotalPosts(adamMonthly, cy, cm);
    const adamICP         = getTotalICPConnections(adamMonthly, cy, cm);

    // ── Chore ──────────────────────────────────────────────────────────────
    const choreFollowers   = getCurrentFollowers(choreWeekly);
    const choreGrowth      = getFollowerGrowth(choreWeekly, cy, cm);
    const choreImpressions = getTotalImpressions(choreMonthly, cy, cm);
    const choreEngagement  = getAvgEngagementRate(choreMonthly, cy, cm);

    // ── Goals ──────────────────────────────────────────────────────────────
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

    // ── On-track flags ─────────────────────────────────────────────────────
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
      {/* Health score + month header */}
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

        {/* Adam-only: Posts Published */}
        <MetricCard
          label="Adam — Posts Published"
          value={String(adamPostCount)}
          onTrack={isOnTrack(adamPostCount, adamGoals.posts, cy, cm)}
          accent={ADAM_BLUE}
          goal={adamGoals.posts ? `${adamGoals.posts} posts` : null}
          subLabel="Adam only — Chore does not track posts in weekly data"
        />

        {/* Adam-only: ICP Connections */}
        <MetricCard
          label="Adam — ICP Connections"
          value={formatNumber(adamICP)}
          onTrack={isOnTrack(adamICP, adamGoals.icp, cy, cm)}
          accent={ADAM_BLUE}
          goal={adamGoals.icp ? formatNumber(adamGoals.icp) : null}
          subLabel="Adam only — this month"
        />
      </div>

      {/* Website Traffic — Organic Social (GA4) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-300">Website Traffic — Organic Social</h3>
          <p className="text-xs text-slate-500 mt-0.5">GA4 · Sessions driven by organic social channels</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Sessions"
                value={formatNumber(ga4Data.totals.sessions)}
                change={ga4Data.prevTotals ? formatChange(ga4Data.totals.sessions, ga4Data.prevTotals.sessions) : undefined}
                accent={GA4_GREEN}
                subLabel="Organic social — this month"
              />
              <MetricCard
                label="Users"
                value={formatNumber(ga4Data.totals.users)}
                change={ga4Data.prevTotals ? formatChange(ga4Data.totals.users, ga4Data.prevTotals.users) : undefined}
                accent={GA4_GREEN}
                subLabel="Organic social — this month"
              />
              <MetricCard
                label="Page Views"
                value={formatNumber(ga4Data.totals.pageViews)}
                change={ga4Data.prevTotals ? formatChange(ga4Data.totals.pageViews, ga4Data.prevTotals.pageViews) : undefined}
                accent={GA4_GREEN}
                subLabel="Organic social — this month"
              />
            </div>
            <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5">
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Sessions Over Time</h4>
              <GA4SessionsLine byDate={ga4Data.byDate} />
            </div>
          </>
        )}
      </div>

      {/* Combined follower chart */}
      <CombinedFollowerChart adamWeekly={adamWeekly} choreWeekly={choreWeekly} />

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

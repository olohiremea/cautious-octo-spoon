import { useMemo } from 'react';
import ComparisonCard from './ComparisonCard';
import MetricCard from './MetricCard';
import HealthScoreRing from './HealthScoreRing';
import { CombinedFollowerChart } from './FollowerChart';
import AIInsights from './AIInsights';
import {
  getFollowerGrowth,
  getTotalImpressions,
  getAvgEngagementRate,
  getTotalPosts,
  getCurrentFollowers,
  isOnTrack,
  findGoal,
  calculateHealthScore,
  formatNumber,
} from '../utils/dataHelpers';

const ADAM_BLUE   = '#3B82F6';
const CHORE_PURPLE = '#8B5CF6';

export default function UnifiedView({ adamWeekly, adamMonthly, choreWeekly, choreMonthly, adamPosts, chorePosts, goals, year, month }) {
  // Derive "last month" from selected year/month
  const ly = month === 0 ? year - 1 : year;
  const lm = month === 0 ? 11 : month - 1;

  const cy = year;
  const cm = month;

  const metrics = useMemo(() => {
    // ── Adam ───────────────────────────────────────────────────────────────
    const adamFollowers   = getCurrentFollowers(adamWeekly);
    const adamGrowth      = getFollowerGrowth(adamWeekly, cy, cm);
    const adamImpressions = getTotalImpressions(adamMonthly, cy, cm);
    const adamEngagement  = getAvgEngagementRate(adamMonthly, cy, cm);
    const adamPostCount   = getTotalPosts(adamMonthly, cy, cm);

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
    ];
    const choreTracking = [
      isOnTrack(choreGrowth,      choreGoals.growth,      cy, cm),
      isOnTrack(choreImpressions, choreGoals.impressions, cy, cm),
      isOnTrack(choreEngagement,  choreGoals.engagement,  cy, cm),
    ];

    return {
      adamFollowers, adamGrowth, adamImpressions, adamEngagement, adamPostCount,
      choreFollowers, choreGrowth, choreImpressions, choreEngagement,
      adamGoals, choreGoals,
      adamHealth:  calculateHealthScore(adamTracking),
      choreHealth: calculateHealthScore(choreTracking),
    };
  }, [adamWeekly, adamMonthly, choreWeekly, choreMonthly, goals, cy, cm]);

  const {
    adamFollowers, adamGrowth, adamImpressions, adamEngagement, adamPostCount,
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

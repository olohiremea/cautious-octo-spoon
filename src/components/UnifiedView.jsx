import { useMemo } from 'react';
import ComparisonCard from './ComparisonCard';
import MetricCard from './MetricCard';
import HealthScoreRing from './HealthScoreRing';
import { CombinedFollowerChart } from './FollowerChart';
import {
  currentMonthYM,
  lastMonthYM,
  getFollowerGrowth,
  getTotalImpressions,
  getAvgEngagementRate,
  getTotalPosts,
  getTotalProfileViews,
  getCurrentFollowers,
  isOnTrack,
  findGoal,
  calculateHealthScore,
  formatNumber,
} from '../utils/dataHelpers';

const ADAM_BLUE = '#3B82F6';
const CHORE_PURPLE = '#8B5CF6';

export default function UnifiedView({ adamWeekly, choreWeekly, goals }) {
  const { year: cy, month: cm } = currentMonthYM();
  const { year: ly, month: lm } = lastMonthYM();
  const cd = new Date().getDate(); // current day-of-month; keeps pro-rating fresh daily

  const metrics = useMemo(() => {
    // ── Adam ───────────────────────────────────────────────────────────────
    const adamFollowers = getCurrentFollowers(adamWeekly);
    const adamGrowth = getFollowerGrowth(adamWeekly, cy, cm);
    const adamImpressions = getTotalImpressions(adamWeekly, cy, cm);
    const adamEngagement = getAvgEngagementRate(adamWeekly, cy, cm);
    const adamPosts = getTotalPosts(adamWeekly, cy, cm);
    const adamProfileViews = getTotalProfileViews(adamWeekly, cy, cm);

    // ── Chore ──────────────────────────────────────────────────────────────
    const choreFollowers = getCurrentFollowers(choreWeekly);
    const choreGrowth = getFollowerGrowth(choreWeekly, cy, cm);
    const choreImpressions = getTotalImpressions(choreWeekly, cy, cm);
    const choreEngagement = getAvgEngagementRate(choreWeekly, cy, cm);
    const chorePosts = getTotalPosts(choreWeekly, cy, cm);

    // ── Goals ──────────────────────────────────────────────────────────────
    const adamGoals = {
      growth: findGoal(goals, 'Adam', 'Followers_Growth'),
      impressions: findGoal(goals, 'Adam', 'Impressions'),
      engagement: findGoal(goals, 'Adam', 'Engagement_Rate'),
      posts: findGoal(goals, 'Adam', 'Posts_Published'),
      profileViews: findGoal(goals, 'Adam', 'Profile_Views'),
    };
    const choreGoals = {
      growth: findGoal(goals, 'Chore', 'Followers_Growth'),
      impressions: findGoal(goals, 'Chore', 'Impressions'),
      engagement: findGoal(goals, 'Chore', 'Engagement_Rate'),
      posts: findGoal(goals, 'Chore', 'Posts_Published'),
    };

    // ── On-track flags ─────────────────────────────────────────────────────
    const adamTracking = [
      isOnTrack(adamGrowth, adamGoals.growth),
      isOnTrack(adamImpressions, adamGoals.impressions),
      isOnTrack(adamEngagement, adamGoals.engagement),
      isOnTrack(adamPosts, adamGoals.posts),
      isOnTrack(adamProfileViews, adamGoals.profileViews),
    ];
    const choreTracking = [
      isOnTrack(choreGrowth, choreGoals.growth),
      isOnTrack(choreImpressions, choreGoals.impressions),
      isOnTrack(choreEngagement, choreGoals.engagement),
      isOnTrack(chorePosts, choreGoals.posts),
    ];

    const adamHealth = calculateHealthScore(adamTracking);
    const choreHealth = calculateHealthScore(choreTracking);

    return {
      adamFollowers, adamGrowth, adamImpressions, adamEngagement, adamPosts, adamProfileViews,
      choreFollowers, choreGrowth, choreImpressions, choreEngagement, chorePosts,
      adamGoals, choreGoals, adamTracking, choreTracking,
      adamHealth, choreHealth,
    };
  }, [adamWeekly, choreWeekly, goals, cy, cm, cd]);

  const {
    adamFollowers, adamGrowth, adamImpressions, adamEngagement, adamPosts, adamProfileViews,
    choreFollowers, choreGrowth, choreImpressions, choreEngagement, chorePosts,
    adamGoals, choreGoals, adamTracking, choreTracking,
    adamHealth, choreHealth,
  } = metrics;

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Health score + month header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Overview — {monthName}</h2>
          <p className="text-sm text-slate-500 mt-0.5">Side-by-side snapshot of both LinkedIn accounts</p>
        </div>
        <div className="flex gap-8">
          <HealthScoreRing score={adamHealth ?? 0} color={ADAM_BLUE} label="Adam" />
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
          adamOnTrack={isOnTrack(adamGrowth, adamGoals.growth)}
          choreOnTrack={isOnTrack(choreGrowth, choreGoals.growth)}
          adamSub={adamGoals.growth ? `Goal: +${formatNumber(adamGoals.growth)}` : null}
          choreSub={choreGoals.growth ? `Goal: +${formatNumber(choreGoals.growth)}` : null}
        />
        <ComparisonCard
          label="Total Impressions This Month"
          adamValue={formatNumber(adamImpressions)}
          choreValue={formatNumber(choreImpressions)}
          adamOnTrack={isOnTrack(adamImpressions, adamGoals.impressions)}
          choreOnTrack={isOnTrack(choreImpressions, choreGoals.impressions)}
          adamSub={adamGoals.impressions ? `Goal: ${formatNumber(adamGoals.impressions)}` : null}
          choreSub={choreGoals.impressions ? `Goal: ${formatNumber(choreGoals.impressions)}` : null}
        />
        <ComparisonCard
          label="Avg. Engagement Rate"
          adamValue={`${adamEngagement}%`}
          choreValue={`${choreEngagement}%`}
          adamOnTrack={isOnTrack(adamEngagement, adamGoals.engagement)}
          choreOnTrack={isOnTrack(choreEngagement, choreGoals.engagement)}
          adamSub={adamGoals.engagement ? `Goal: ${adamGoals.engagement}%` : null}
          choreSub={choreGoals.engagement ? `Goal: ${choreGoals.engagement}%` : null}
        />
        <ComparisonCard
          label="Posts Published This Month"
          adamValue={String(adamPosts)}
          choreValue={String(chorePosts)}
          adamOnTrack={isOnTrack(adamPosts, adamGoals.posts)}
          choreOnTrack={isOnTrack(chorePosts, choreGoals.posts)}
          adamSub={adamGoals.posts ? `Goal: ${adamGoals.posts} posts` : null}
          choreSub={choreGoals.posts ? `Goal: ${choreGoals.posts} posts` : null}
        />

        {/* Adam-only profile views card */}
        <MetricCard
          label="Adam — Profile Views (this month)"
          value={formatNumber(adamProfileViews)}
          onTrack={isOnTrack(adamProfileViews, adamGoals.profileViews)}
          accent={ADAM_BLUE}
          goal={adamGoals.profileViews ? `${formatNumber(adamGoals.profileViews)} views` : null}
          subLabel="Adam only — Chore does not track profile views"
        />
      </div>

      {/* Combined follower chart */}
      <CombinedFollowerChart adamWeekly={adamWeekly} choreWeekly={choreWeekly} />
    </div>
  );
}

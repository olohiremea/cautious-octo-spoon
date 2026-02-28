import { useMemo } from 'react';
import MetricCard from './MetricCard';
import PostsTable from './PostsTable';
import { SingleFollowerChart } from './FollowerChart';
import ImpressionsChart from './ImpressionsChart';
import EngagementChart from './EngagementChart';
import ProfileViewsChart from './ProfileViewsChart';
import HealthScoreRing from './HealthScoreRing';
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
  formatChange,
} from '../utils/dataHelpers';

export default function AccountTab({ account, weeklyData, postsData, goals }) {
  const isAdam = account === 'Adam';
  const color = isAdam ? '#3B82F6' : '#8B5CF6';

  const { year: cy, month: cm } = currentMonthYM();
  const { year: ly, month: lm } = lastMonthYM();

  const metrics = useMemo(() => {
    // Current month
    const followers = getCurrentFollowers(weeklyData);
    const growth = getFollowerGrowth(weeklyData, cy, cm);
    const impressions = getTotalImpressions(weeklyData, cy, cm);
    const engagement = getAvgEngagementRate(weeklyData, cy, cm);
    const posts = getTotalPosts(weeklyData, cy, cm);

    // Last month (for change %)
    const growthLast = getFollowerGrowth(weeklyData, ly, lm);
    const impressionsLast = getTotalImpressions(weeklyData, ly, lm);
    const engagementLast = getAvgEngagementRate(weeklyData, ly, lm);
    const postsLast = getTotalPosts(weeklyData, ly, lm);

    // Profile views (Adam only)
    const profileViews = isAdam ? getTotalProfileViews(weeklyData, cy, cm) : null;
    const profileViewsLast = isAdam ? getTotalProfileViews(weeklyData, ly, lm) : null;

    // Goals
    const goalGrowth = findGoal(goals, account, 'Followers_Growth');
    const goalImpressions = findGoal(goals, account, 'Impressions');
    const goalEngagement = findGoal(goals, account, 'Engagement_Rate');
    const goalPosts = findGoal(goals, account, 'Posts_Published');
    const goalProfileViews = isAdam ? findGoal(goals, account, 'Profile_Views') : null;

    // On-track
    const growthOT = isOnTrack(growth, goalGrowth);
    const impressionsOT = isOnTrack(impressions, goalImpressions);
    const engagementOT = isOnTrack(engagement, goalEngagement);
    const postsOT = isOnTrack(posts, goalPosts);
    const profileViewsOT = isAdam ? isOnTrack(profileViews, goalProfileViews) : null;

    const trackingList = isAdam
      ? [growthOT, impressionsOT, engagementOT, postsOT, profileViewsOT]
      : [growthOT, impressionsOT, engagementOT, postsOT];

    const healthScore = calculateHealthScore(trackingList);

    return {
      followers,
      growth, growthChange: formatChange(growth, growthLast),
      impressions, impressionsChange: formatChange(impressions, impressionsLast),
      engagement, engagementChange: formatChange(engagement, engagementLast),
      posts, postsChange: formatChange(posts, postsLast),
      profileViews, profileViewsChange: isAdam ? formatChange(profileViews, profileViewsLast) : null,
      goalGrowth, goalImpressions, goalEngagement, goalPosts, goalProfileViews,
      growthOT, impressionsOT, engagementOT, postsOT, profileViewsOT,
      healthScore,
    };
  }, [weeklyData, goals, account, cy, cm, ly, lm, isAdam]);

  const m = metrics;
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            <span style={{ color }}>{account}</span>'s LinkedIn — {monthName}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAdam ? 'Personal profile analytics' : 'Company page analytics'}
          </p>
        </div>
        <HealthScoreRing score={m.healthScore ?? 0} color={color} label={account} />
      </div>

      {/* High-level metric cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdam ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
        <MetricCard
          label="Total Followers"
          value={formatNumber(m.followers)}
          accent={color}
          subLabel="All-time cumulative"
        />
        <MetricCard
          label="Follower Growth"
          value={`+${formatNumber(m.growth)}`}
          change={m.growthChange}
          onTrack={m.growthOT}
          accent={color}
          goal={m.goalGrowth ? `+${formatNumber(m.goalGrowth)} this month` : null}
          subLabel="vs. last month"
        />
        <MetricCard
          label="Impressions"
          value={formatNumber(m.impressions)}
          change={m.impressionsChange}
          onTrack={m.impressionsOT}
          accent={color}
          goal={m.goalImpressions ? formatNumber(m.goalImpressions) : null}
          subLabel="This month total"
        />
        <MetricCard
          label="Avg. Engagement Rate"
          value={`${m.engagement}%`}
          change={m.engagementChange}
          onTrack={m.engagementOT}
          accent={color}
          goal={m.goalEngagement ? `${m.goalEngagement}%` : null}
          subLabel="This month average"
        />
        <MetricCard
          label="Posts Published"
          value={String(m.posts)}
          change={m.postsChange}
          onTrack={m.postsOT}
          accent={color}
          goal={m.goalPosts ? `${m.goalPosts} posts` : null}
          subLabel="This month"
        />
        {isAdam && (
          <MetricCard
            label="Profile Views"
            value={formatNumber(m.profileViews)}
            change={m.profileViewsChange}
            onTrack={m.profileViewsOT}
            accent={color}
            goal={m.goalProfileViews ? formatNumber(m.goalProfileViews) : null}
            subLabel="This month total"
          />
        )}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SingleFollowerChart weeklyData={weeklyData} color={color} label="Followers" />
        <ImpressionsChart weeklyData={weeklyData} color={color} />
      </div>
      <div className={`grid grid-cols-1 ${isAdam ? 'lg:grid-cols-2' : ''} gap-4`}>
        <EngagementChart
          weeklyData={weeklyData}
          color={color}
          goalRate={m.goalEngagement}
        />
        {isAdam && <ProfileViewsChart weeklyData={weeklyData} />}
      </div>

      {/* Posts table */}
      <PostsTable posts={postsData} accentColor={color} />
    </div>
  );
}

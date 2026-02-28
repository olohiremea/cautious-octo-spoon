import { useMemo } from 'react';
import MetricCard from './MetricCard';
import PostsTable from './PostsTable';
import { SingleFollowerChart } from './FollowerChart';
import ImpressionsChart from './ImpressionsChart';
import EngagementChart from './EngagementChart';
import HealthScoreRing from './HealthScoreRing';
import {
  currentMonthYM,
  lastMonthYM,
  getFollowerGrowth,
  getTotalImpressions,
  getAvgEngagementRate,
  getTotalPosts,
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

    // Last month (for change %)
    const growthLast = getFollowerGrowth(weeklyData, ly, lm);
    const impressionsLast = getTotalImpressions(weeklyData, ly, lm);
    const engagementLast = getAvgEngagementRate(weeklyData, ly, lm);

    // Posts Published — Adam only (Chore_Weekly has no Posts_Published column)
    const posts = isAdam ? getTotalPosts(weeklyData, cy, cm) : null;
    const postsLast = isAdam ? getTotalPosts(weeklyData, ly, lm) : null;

    // Goals
    const goalGrowth = findGoal(goals, account, 'Followers_Growth');
    const goalImpressions = findGoal(goals, account, 'Impressions');
    const goalEngagement = findGoal(goals, account, 'Engagement_Rate');
    const goalPosts = isAdam ? findGoal(goals, account, 'Posts_Published') : null;

    // On-track
    const growthOT = isOnTrack(growth, goalGrowth);
    const impressionsOT = isOnTrack(impressions, goalImpressions);
    const engagementOT = isOnTrack(engagement, goalEngagement);
    const postsOT = isAdam ? isOnTrack(posts, goalPosts) : null;

    const trackingList = isAdam
      ? [growthOT, impressionsOT, engagementOT, postsOT]
      : [growthOT, impressionsOT, engagementOT];

    const healthScore = calculateHealthScore(trackingList);

    return {
      followers,
      growth, growthChange: formatChange(growth, growthLast),
      impressions, impressionsChange: formatChange(impressions, impressionsLast),
      engagement, engagementChange: formatChange(engagement, engagementLast),
      posts, postsChange: isAdam ? formatChange(posts, postsLast) : null,
      goalGrowth, goalImpressions, goalEngagement, goalPosts,
      growthOT, impressionsOT, engagementOT, postsOT,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        {isAdam && (
          <MetricCard
            label="Posts Published"
            value={String(m.posts)}
            change={m.postsChange}
            onTrack={m.postsOT}
            accent={color}
            goal={m.goalPosts ? `${m.goalPosts} posts` : null}
            subLabel="This month"
          />
        )}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SingleFollowerChart weeklyData={weeklyData} color={color} label="Followers" />
        <ImpressionsChart weeklyData={weeklyData} color={color} />
      </div>
      <EngagementChart
        weeklyData={weeklyData}
        color={color}
        goalRate={m.goalEngagement}
      />

      {/* Posts table */}
      <PostsTable posts={postsData} account={account} accentColor={color} />
    </div>
  );
}

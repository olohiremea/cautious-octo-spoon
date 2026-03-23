import { useMemo } from 'react';
import MetricCard from './MetricCard';
import PostsTable from './PostsTable';
import { SingleFollowerChart } from './FollowerChart';
import ImpressionsChart from './ImpressionsChart';
import EngagementChart from './EngagementChart';
import HealthScoreRing from './HealthScoreRing';
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

export default function AccountTab({ account, weeklyData, monthlyData, postsData, goals, year, month }) {
  const isAdam = account === 'Adam';
  const color = isAdam ? '#3B82F6' : '#8B5CF6';

  // Derive "last month" from the selected year/month
  const ly = month === 0 ? year - 1 : year;
  const lm = month === 0 ? 11 : month - 1;

  const cy = year;
  const cm = month;

  const metrics = useMemo(() => {
    const followers = getCurrentFollowers(weeklyData);
    const growth = getFollowerGrowth(weeklyData, cy, cm);
    const impressions = getTotalImpressions(monthlyData, cy, cm);
    const engagement = getAvgEngagementRate(monthlyData, cy, cm);

    const growthLast = getFollowerGrowth(weeklyData, ly, lm);
    const impressionsLast = getTotalImpressions(monthlyData, ly, lm);
    const engagementLast = getAvgEngagementRate(monthlyData, ly, lm);

    // Posts Published — Adam only
    const posts = isAdam ? getTotalPosts(monthlyData, cy, cm) : null;
    const postsLast = isAdam ? getTotalPosts(monthlyData, ly, lm) : null;

    // ICP Connections — Adam only (number from monthly data)
    const icpConnections = isAdam ? getTotalICPConnections(monthlyData, cy, cm) : null;
    const icpLast = isAdam ? getTotalICPConnections(monthlyData, ly, lm) : null;

    const goalGrowth = findGoal(goals, account, 'Followers_Growth');
    const goalImpressions = findGoal(goals, account, 'Impressions');
    const goalEngagement = findGoal(goals, account, 'Engagement_Rate');
    const goalPosts = isAdam ? findGoal(goals, account, 'Posts_Published') : null;
    const goalICP = isAdam ? findGoal(goals, account, 'ICP_Connection_Requests') : null;

    const growthOT = isOnTrack(growth, goalGrowth, cy, cm);
    const impressionsOT = isOnTrack(impressions, goalImpressions, cy, cm);
    const engagementOT = isOnTrack(engagement, goalEngagement, cy, cm);
    const postsOT = isAdam ? isOnTrack(posts, goalPosts, cy, cm) : null;
    const icpOT = isAdam ? isOnTrack(icpConnections, goalICP, cy, cm) : null;

    const trackingList = isAdam
      ? [growthOT, impressionsOT, engagementOT, postsOT, icpOT]
      : [growthOT, impressionsOT, engagementOT];

    const healthScore = calculateHealthScore(trackingList);

    return {
      followers,
      growth, growthChange: formatChange(growth, growthLast),
      impressions, impressionsChange: formatChange(impressions, impressionsLast),
      engagement, engagementChange: formatChange(engagement, engagementLast),
      posts, postsChange: isAdam ? formatChange(posts, postsLast) : null,
      icpConnections, icpChange: isAdam ? formatChange(icpConnections, icpLast) : null,
      goalGrowth, goalImpressions, goalEngagement, goalPosts, goalICP,
      growthOT, impressionsOT, engagementOT, postsOT, icpOT,
      healthScore,
    };
  }, [weeklyData, monthlyData, goals, account, cy, cm, ly, lm, isAdam]);

  const m = metrics;
  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

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
        {isAdam && (
          <MetricCard
            label="ICP Connections"
            value={formatNumber(m.icpConnections)}
            change={m.icpChange}
            onTrack={m.icpOT}
            accent={color}
            goal={m.goalICP ? formatNumber(m.goalICP) : null}
            subLabel="This month"
          />
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SingleFollowerChart weeklyData={weeklyData} color={color} label="Followers" />
        <ImpressionsChart weeklyData={weeklyData} color={color} />
      </div>
      <EngagementChart weeklyData={weeklyData} color={color} goalRate={m.goalEngagement} />

      {isAdam && (
        <ImpressionsChart
          weeklyData={weeklyData}
          color={color}
          dataKey="ICP_Connection_Requests"
          label="ICP Connections"
        />
      )}

      {/* Posts table */}
      <PostsTable posts={postsData} account={account} accentColor={color} />
    </div>
  );
}

import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import MetricCard from './MetricCard';
import useXData from '../hooks/useXData';
import { formatNumber } from '../utils/dataHelpers';

const X_BLUE = '#1D9BF0';

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.732-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

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

// "2026-W12" → "Wk 12"
function fmtWeek(w) {
  const m = String(w).match(/W(\d+)$/);
  return m ? `Wk ${parseInt(m[1], 10)}` : w;
}

function WeeklyImpressionsChart({ weekly }) {
  const data = weekly.map((w) => ({ week: fmtWeek(w.week), Impressions: w.impressions }));
  if (!data.length) return <p className="text-slate-500 text-sm text-center py-6">No impression data for this period.</p>;
  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 shadow-md">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">Weekly Impressions</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatNumber} width={52} />
          <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
          <Bar dataKey="Impressions" fill={X_BLUE} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function WeeklyEngagementChart({ weekly }) {
  const data = weekly.map((w) => ({
    week: fmtWeek(w.week),
    'Eng. Rate': w.impressions > 0 ? parseFloat(((w.engagements / w.impressions) * 100).toFixed(2)) : null,
  }));
  if (!data.length) return null;
  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 shadow-md">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">Weekly Engagement Rate</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={44} />
          <Tooltip content={<DarkTooltip formatter={(v) => `${v}%`} />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
          <Line type="monotone" dataKey="Eng. Rate" stroke={X_BLUE} strokeWidth={2.5} dot={{ r: 3, fill: X_BLUE, strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TweetsTable({ tweets }) {
  if (!tweets?.length) return <p className="text-slate-500 text-sm text-center py-6">No tweets found for this period.</p>;
  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 shadow-md overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-slate-200">Tweets This Month</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-2 text-left font-medium">Date</th>
              <th className="px-4 py-2 text-right font-medium">Impressions</th>
              <th className="px-4 py-2 text-right font-medium">Engagements</th>
              <th className="px-4 py-2 text-right font-medium">Likes</th>
              <th className="px-4 py-2 text-right font-medium">Retweets</th>
              <th className="px-4 py-2 text-right font-medium">Replies</th>
              <th className="px-4 py-2 text-right font-medium">Eng. Rate</th>
              <th className="px-4 py-2 text-right font-medium">Profile Clicks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {tweets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </td>
                <td className="px-4 py-3 text-right text-slate-300">{t.impressions != null ? formatNumber(t.impressions) : '—'}</td>
                <td className="px-4 py-3 text-right text-slate-300">{formatNumber(t.engagements)}</td>
                <td className="px-4 py-3 text-right text-slate-300">{formatNumber(t.likes)}</td>
                <td className="px-4 py-3 text-right text-slate-300">{formatNumber(t.retweets)}</td>
                <td className="px-4 py-3 text-right text-slate-300">{formatNumber(t.replies)}</td>
                <td className="px-4 py-3 text-right text-slate-300">
                  {t.engagementRate != null ? `${t.engagementRate.toFixed(2)}%` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-slate-300">{t.profileClicks != null ? formatNumber(t.profileClicks) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function XTab({ year, month }) {
  const { data, loading, error } = useXData(year, month);
  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const m = data?.monthly ?? {};
  const p = data?.profile ?? {};

  const engRateStr = m.engagementRate != null ? `${m.engagementRate.toFixed(2)}%` : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <XIcon className="h-5 w-5 text-slate-300" />
            {p.username ? `@${p.username}` : 'Adam'} — {monthName}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">X profile analytics</p>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-8 text-center text-sm text-slate-500">
          Loading X data…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 p-5 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Followers"
              value={formatNumber(p.followers)}
              accent={X_BLUE}
              subLabel="All-time cumulative"
            />
            <MetricCard
              label="Impressions"
              value={m.impressions != null ? formatNumber(m.impressions) : '—'}
              accent={X_BLUE}
              subLabel={m.impressionsAvailable ? 'This month total' : 'Requires OAuth user context'}
            />
            <MetricCard
              label="Engagement Rate"
              value={engRateStr}
              accent={X_BLUE}
              subLabel="Engagements / impressions"
            />
            <MetricCard
              label="Profile Clicks"
              value={m.profileClicks != null ? formatNumber(m.profileClicks) : '—'}
              accent={X_BLUE}
              subLabel="From tweet clicks this month"
            />
          </div>

          {/* Secondary metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard label="Tweets Published" value={String(m.tweetsPublished ?? 0)} accent={X_BLUE} subLabel="This month" />
            <MetricCard label="Likes"             value={formatNumber(m.likes ?? 0)}    accent={X_BLUE} subLabel="This month" />
            <MetricCard label="Retweets"          value={formatNumber(m.retweets ?? 0)} accent={X_BLUE} subLabel="This month" />
            <MetricCard label="Replies"           value={formatNumber(m.replies ?? 0)}  accent={X_BLUE} subLabel="This month" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WeeklyImpressionsChart weekly={data.weekly ?? []} />
            <WeeklyEngagementChart  weekly={data.weekly ?? []} />
          </div>

          {/* Tweets table */}
          <TweetsTable tweets={data.tweets} />
        </>
      )}
    </div>
  );
}

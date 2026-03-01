import { useState, useMemo, useCallback, useEffect } from 'react';
import { currentMonthYM, findGoal, formatNumber } from '../utils/dataHelpers';

const GEMINI_URL = '/api/gemini';

// ── Stats computation ─────────────────────────────────────────────────────────

function groupByFormat(posts) {
  const groups = {};
  for (const p of posts) {
    const fmt = p.Format ?? 'Unknown';
    if (!groups[fmt]) groups[fmt] = [];
    groups[fmt].push(p);
  }
  return groups;
}

function avg(arr, key) {
  if (!arr.length) return 0;
  return parseFloat((arr.reduce((s, p) => s + (p[key] ?? 0), 0) / arr.length).toFixed(1));
}

function buildPrompt({ formatStats, adamMetrics, choreMetrics }) {
  const formatTable = Object.entries(formatStats)
    .sort((a, b) => b[1].avgEngRate - a[1].avgEngRate)
    .map(([fmt, s]) =>
      `  • ${fmt}: ${s.count} posts | avg impressions ${formatNumber(s.avgImpressions)} | avg eng. rate ${s.avgEngRate}% | avg engagements ${formatNumber(s.avgEngagements)} | avg profile views ${formatNumber(s.avgProfileViews)} | avg followers gained ${formatNumber(s.avgFollowersGained)}`
    )
    .join('\n');

  const adamGoalLines = adamMetrics.map((m) =>
    `  • ${m.label}: ${m.current} / goal ${m.goal} (${m.pct}% of goal)`
  ).join('\n');

  const choreGoalLines = choreMetrics.map((m) =>
    `  • ${m.label}: ${m.current} / goal ${m.goal} (${m.pct}% of goal)`
  ).join('\n');

  return `You are a LinkedIn growth strategist. Analyze the data below and give 4-6 specific, actionable bullet-point insights. Focus on:
1. Which post formats are driving the most reach and engagement for Adam and why
2. What Chore should prioritise to grow faster based on their current numbers
3. Concrete actions both accounts should take to hit their monthly goals

ADAM — POST PERFORMANCE BY FORMAT (this month):
${formatTable || '  (no post data yet)'}

ADAM — CURRENT MONTH vs GOALS:
${adamGoalLines || '  (no data)'}

CHORE — CURRENT MONTH vs GOALS:
${choreGoalLines || '  (no data)'}

Format your response as concise bullet points (use • as the bullet character). Be direct, specific, and actionable. No preamble.`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AIInsights({ adamPosts, chorePosts, adamWeekly, choreWeekly, goals, year, month }) {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasApiKey = true; // key is held server-side; client always has access

  // Use selected year/month if provided, otherwise fall back to current month
  const { year: defaultYear, month: defaultMonth } = currentMonthYM();
  const cy = year ?? defaultYear;
  const cm = month ?? defaultMonth;

  const prompt = useMemo(() => {
    // Per-format stats from Adam posts
    const groups = groupByFormat(adamPosts ?? []);
    const formatStats = Object.fromEntries(
      Object.entries(groups).map(([fmt, posts]) => [fmt, {
        count: posts.length,
        avgImpressions: avg(posts, 'Impressions'),
        avgEngagements: avg(posts, 'Engagements'),
        // Sheet stores ER as fraction; multiply × 100 for display
        avgEngRate: parseFloat((avg(posts, 'Engagement_Rate') * 100).toFixed(2)),
        avgProfileViews: avg(posts, 'Profile_Views'),
        avgFollowersGained: avg(posts, 'Followers_Gained'),
      }])
    );

    // Goal progress helpers
    function pct(current, goal) {
      if (!goal) return 'N/A';
      return Math.round((current / goal) * 100);
    }

    // Adam weekly totals for this month
    const adamRows = (adamWeekly ?? []).filter((r) => {
      if (!r.Week) return false;
      const [y, m] = String(r.Week).split('-').map(Number);
      return y === cy && m - 1 === cm;
    });
    const adamImpressions = adamRows.reduce((s, r) => s + (r.Impressions ?? 0), 0);
    const adamEngRate = adamRows.length
      ? parseFloat((adamRows.reduce((s, r) => s + (r.Engagement_Rate ?? 0), 0) / adamRows.length).toFixed(2))
      : 0;
    const adamPosts2 = adamRows.reduce((s, r) => s + (r.Posts_Published ?? 0), 0);

    const choreRows = (choreWeekly ?? []).filter((r) => {
      if (!r.Week) return false;
      const [y, m] = String(r.Week).split('-').map(Number);
      return y === cy && m - 1 === cm;
    });
    const choreImpressions = choreRows.reduce((s, r) => s + (r.Impressions ?? 0), 0);
    const choreEngRate = choreRows.length
      ? parseFloat((choreRows.reduce((s, r) => s + (r.Engagement_Rate ?? 0), 0) / choreRows.length).toFixed(2))
      : 0;

    const gA = (metric) => findGoal(goals ?? [], 'Adam', metric);
    const gC = (metric) => findGoal(goals ?? [], 'Chore', metric);

    const adamMetrics = [
      { label: 'Impressions',    current: formatNumber(adamImpressions), goal: formatNumber(gA('Impressions')),    pct: pct(adamImpressions, gA('Impressions'))    },
      { label: 'Engagement Rate',current: `${adamEngRate}%`,             goal: `${gA('Engagement_Rate')}%`,        pct: pct(adamEngRate, gA('Engagement_Rate'))    },
      { label: 'Posts Published', current: adamPosts2,                   goal: gA('Posts_Published'),              pct: pct(adamPosts2, gA('Posts_Published'))     },
    ];
    const choreMetrics = [
      { label: 'Impressions',    current: formatNumber(choreImpressions), goal: formatNumber(gC('Impressions')),   pct: pct(choreImpressions, gC('Impressions'))   },
      { label: 'Engagement Rate',current: `${choreEngRate}%`,             goal: `${gC('Engagement_Rate')}%`,       pct: pct(choreEngRate, gC('Engagement_Rate'))   },
    ];

    return buildPrompt({ formatStats, adamMetrics, choreMetrics });
  }, [adamPosts, adamWeekly, choreWeekly, goals, cy, cm]);

  const fetchInsights = useCallback(async () => {
    if (!hasApiKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Gemini API error ${res.status}`);
      }
      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');
      setInsights(text);
    } catch (err) {
      setError(err.message ?? 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  // Auto-fetch once data is available (only when API key is configured)
  useEffect(() => {
    if (!hasApiKey) return;
    if ((adamPosts?.length || choreWeekly?.length) && !insights && !loading) {
      fetchInsights();
    }
  }, [adamPosts, choreWeekly]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parse bullet points for nicer rendering
  const bullets = insights
    ? insights
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
    : [];

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-base">✦</span>
          <h3 className="text-sm font-semibold text-slate-200">AI Insights</h3>
          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-blue-500/30">
            Gemini
          </span>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading || !hasApiKey}
          className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600 hover:text-slate-100 disabled:opacity-50 transition-colors ring-1 ring-slate-600"
        >
          {loading ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating…
            </>
          ) : (
            'Regenerate'
          )}
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {loading && !insights && (
          <div className="space-y-3 animate-pulse">
            {[90, 75, 85, 70, 80].map((w, i) => (
              <div key={i} className="h-4 rounded bg-slate-700" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-4 py-3 ring-1 ring-red-500/30">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && bullets.length > 0 && (
          <ul className="space-y-3">
            {bullets.map((line, i) => {
              const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
              const text = isBullet ? line.replace(/^[•\-*]\s*/, '') : line;
              if (!isBullet && i > 0) {
                return (
                  <li key={i} className="text-xs text-slate-500 pt-1">{text}</li>
                );
              }
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                  <span className="text-sm text-slate-300 leading-relaxed">{text}</span>
                </li>
              );
            })}
          </ul>
        )}

        {!hasApiKey && (
          <p className="text-sm text-slate-500 text-center py-4">
            Add <code className="text-slate-400">VITE_GEMINI_API_KEY</code> to your <code className="text-slate-400">.env</code> file to enable AI insights.
          </p>
        )}

        {hasApiKey && !loading && !error && !insights && (
          <p className="text-sm text-slate-500 text-center py-4">
            Insights will appear once data is loaded.
          </p>
        )}
      </div>
    </div>
  );
}

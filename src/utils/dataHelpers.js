// ─────────────────────────────────────────────────────────────────────────────
// Data processing utilities for the LinkedIn Analytics Dashboard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a date string as local midnight.
 * Handles YYYY-MM-DD (ISO) and M/D/YYYY / MM/DD/YYYY (Google Sheets default US format).
 * Falls back to native Date constructor for anything else.
 */
function parseLocalDate(str) {
  if (!str) return new Date(NaN);
  const s = String(str).trim();
  // ISO: 2026-02-21
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // US: 2/21/2026 or 02/21/2026 (Google Sheets FORMATTED_VALUE default)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [m, d, y] = s.split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  // Anything else — let the browser try
  return new Date(s);
}

/** Filter weekly rows whose Week date falls in the given month/year */
export function filterByMonth(weeklyData, year, month) {
  return weeklyData.filter((row) => {
    const d = parseLocalDate(row.Week);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/** Return { year, month } for the current month */
export function currentMonthYM() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/** Return { year, month } for the previous month */
export function lastMonthYM() {
  const now = new Date();
  let m = now.getMonth() - 1;
  let y = now.getFullYear();
  if (m < 0) { m = 11; y -= 1; }
  return { year: y, month: m };
}

// ── Follower helpers ─────────────────────────────────────────────────────────

export function getCurrentFollowers(weeklyData) {
  if (!weeklyData.length) return 0;
  return weeklyData[weeklyData.length - 1].Followers ?? 0;
}

export function getFollowerGrowth(weeklyData, year, month) {
  const monthRows = filterByMonth(weeklyData, year, month);
  if (!monthRows.length) return 0;

  // Start of this month = end of previous month
  const { year: py, month: pm } = (() => {
    let m = month - 1; let y = year;
    if (m < 0) { m = 11; y -= 1; }
    return { year: y, month: m };
  })();
  const prevRows = filterByMonth(weeklyData, py, pm);
  const startFollowers = prevRows.length
    ? prevRows[prevRows.length - 1].Followers
    : monthRows[0].Followers;
  const endFollowers = monthRows[monthRows.length - 1].Followers;
  return endFollowers - startFollowers;
}

// ── Impression helpers ───────────────────────────────────────────────────────

export function getTotalImpressions(weeklyData, year, month) {
  return filterByMonth(weeklyData, year, month)
    .reduce((s, r) => s + (r.Impressions ?? 0), 0);
}

// ── Engagement helpers ───────────────────────────────────────────────────────

export function getAvgEngagementRate(weeklyData, year, month) {
  const rows = filterByMonth(weeklyData, year, month);
  if (!rows.length) return 0;
  const sum = rows.reduce((s, r) => s + (r.Engagement_Rate ?? 0), 0);
  return parseFloat((sum / rows.length).toFixed(2));
}

// ── Post helpers ─────────────────────────────────────────────────────────────

export function getTotalPosts(weeklyData, year, month) {
  return filterByMonth(weeklyData, year, month)
    .reduce((s, r) => s + (r.Posts_Published ?? 0), 0);
}

// ── Goal helpers ─────────────────────────────────────────────────────────────

/** Pro-rated monthly goal based on today's day-of-month */
export function proRatedGoal(monthlyGoal) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (monthlyGoal / daysInMonth) * now.getDate();
}

export function isOnTrack(currentValue, monthlyGoal) {
  if (monthlyGoal == null) return null;
  return currentValue >= proRatedGoal(monthlyGoal);
}

/** Find a goal value from the goals array */
export function findGoal(goals, account, metric) {
  const row = goals.find(
    (g) => g.Account === account && g.Metric === metric
  );
  return row ? row.Monthly_Goal : null;
}

/** Calculate overall health score: % of metrics that are on-track */
export function calculateHealthScore(trackingList) {
  // trackingList: array of booleans/nulls from isOnTrack()
  const valid = trackingList.filter((v) => v !== null);
  if (!valid.length) return null;
  return Math.round((valid.filter(Boolean).length / valid.length) * 100);
}

// ── Post-level helpers ────────────────────────────────────────────────────────

/** Engagement_Rate is pre-calculated in the sheet — pass posts through unchanged */
export function enrichPosts(posts) {
  return posts.map((p) => ({ ...p }));
}

/**
 * Returns the average post engagement rate as a **percentage** value (e.g. 2.35).
 * The posts sheet stores Engagement_Rate as a decimal fraction (e.g. 0.0235),
 * so we multiply by 100 before returning.
 */
export function getAvgPostEngagementRate(posts) {
  if (!posts.length) return 0;
  const avg = posts.reduce((s, p) => s + (p.Engagement_Rate ?? 0), 0) / posts.length;
  return parseFloat((avg * 100).toFixed(2));
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatNumber(num) {
  if (num == null) return '—';
  if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toLocaleString();
}

export function formatChange(current, previous) {
  if (previous == null || previous === 0) return { value: '—', pct: null };
  const diff = current - previous;
  const pct = ((diff / Math.abs(previous)) * 100).toFixed(1);
  const sign = diff >= 0 ? '+' : '';
  return {
    value: `${sign}${formatNumber(diff)}`,
    pct: `${sign}${pct}%`,
    positive: diff >= 0,
  };
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatWeekLabel(dateStr) {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

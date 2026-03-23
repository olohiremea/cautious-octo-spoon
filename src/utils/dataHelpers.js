// ─────────────────────────────────────────────────────────────────────────────
// Data processing utilities for the LinkedIn Analytics Dashboard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a date value coming from the Google Visualization API (gviz/tq endpoint).
 * The GViz API serialises date cell values as the string "Date(YYYY,M,D)" where
 * M is 0-indexed (January = 0).  This is true regardless of the cell's display
 * format in the spreadsheet.
 *
 * Also handles ISO (YYYY-MM-DD) and US slash (M/D/YYYY) formats as fallbacks.
 */
function parseLocalDate(str) {
  if (!str) return new Date(NaN);
  if (str instanceof Date) return str;

  const s = String(str).trim();

  // Google Visualization API: "Date(2026,1,21)"  — month is already 0-indexed
  const gviz = s.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)$/);
  if (gviz) {
    return new Date(Number(gviz[1]), Number(gviz[2]), Number(gviz[3]));
  }

  // ISO year-month only: "2026-02"
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }

  // ISO: "2026-02-21"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // US slash: "2/21/2026" or "02/21/2026"
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [m, d, y] = s.split('/').map(Number);
    return new Date(y, m - 1, d);
  }

  return new Date(s);
}

/** Filter rows whose date (Week or Month column) falls in the given month/year */
export function filterByMonth(weeklyData, year, month) {
  return weeklyData.filter((row) => {
    const dateVal = row.Week ?? row.Month;
    const d = parseLocalDate(dateVal);
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

// ── ICP Connection helpers ────────────────────────────────────────────────────

export function getTotalICPConnections(data, year, month) {
  return filterByMonth(data, year, month)
    .reduce((s, r) => s + (r.ICP_Connections ?? 0), 0);
}

// ── Goal helpers ─────────────────────────────────────────────────────────────

/** Pro-rated monthly goal based on today's day-of-month */
export function proRatedGoal(monthlyGoal) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (monthlyGoal / daysInMonth) * now.getDate();
}

export function isOnTrack(currentValue, monthlyGoal, year, month) {
  if (monthlyGoal == null) return null;
  const now = new Date();
  // Past complete months: compare final value against the full monthly goal.
  // Current month (still in progress): pro-rate based on today's position.
  const isPastMonth =
    year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth());
  const target = isPastMonth ? monthlyGoal : proRatedGoal(monthlyGoal);
  return currentValue >= target;
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

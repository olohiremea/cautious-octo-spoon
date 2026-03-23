import { google } from 'googleapis';

// Parse service account JSON once at cold-start
let ga4ServiceAccount = null;
try {
  ga4ServiceAccount = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON || 'null');
} catch {
  // Handled inside the handler
}

const CHANNELS = ['Organic Social', 'Direct', 'Organic Search'];

const channelFilter = {
  orGroup: {
    expressions: CHANNELS.map((value) => ({
      filter: {
        fieldName: 'sessionDefaultChannelGrouping',
        stringFilter: { value, matchType: 'EXACT' },
      },
    })),
  },
};

const organicSocialFilter = {
  filter: {
    fieldName: 'sessionDefaultChannelGrouping',
    stringFilter: { value: 'Organic Social', matchType: 'EXACT' },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
  if (!GA4_PROPERTY_ID || GA4_PROPERTY_ID === 'REPLACE_WITH_YOUR_GA4_PROPERTY_ID') {
    return res.status(503).json({
      error: 'GA4_PROPERTY_ID is not configured. Set it in Vercel → Project Settings → Environment Variables, then redeploy.',
    });
  }
  if (!ga4ServiceAccount) {
    return res.status(503).json({
      error: 'GA4_SERVICE_ACCOUNT_JSON is not configured or is invalid JSON. Set it in Vercel → Project Settings → Environment Variables, then redeploy.',
    });
  }

  const year  = parseInt(req.query.year,  10);
  const month = parseInt(req.query.month, 10); // 1-indexed
  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Provide valid year and month (1–12) query params.' });
  }

  const pad = (n) => String(n).padStart(2, '0');
  const startDate = `${year}-${pad(month)}-01`;
  const lastDay   = new Date(year, month, 0).getDate();
  const endDate   = `${year}-${pad(month)}-${pad(lastDay)}`;

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;
  const prevStart = `${prevYear}-${pad(prevMonth)}-01`;
  const prevLast  = new Date(prevYear, prevMonth, 0).getDate();
  const prevEnd   = `${prevYear}-${pad(prevMonth)}-${pad(prevLast)}`;

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: ga4ServiceAccount,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
    const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
    const property = `properties/${GA4_PROPERTY_ID}`;

    const [byDateRes, bySourceRes, prevByChannelRes] = await Promise.all([
      // Current month: sessions by date × channel (all 3 channels)
      analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [
            { name: 'date' },
            { name: 'sessionDefaultChannelGrouping' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
          ],
          dimensionFilter: channelFilter,
          orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
        },
      }),
      // Current month: top sources within Organic Social
      analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
          dimensionFilter: organicSocialFilter,
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10,
        },
      }),
      // Previous month: totals by channel (for MoM comparison)
      analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: prevStart, endDate: prevEnd }],
          dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
          ],
          dimensionFilter: channelFilter,
        },
      }),
    ]);

    // ── Parse by-date rows, grouped by channel ────────────────────────────────
    const channelsByDate = {};
    for (const row of byDateRes.data.rows ?? []) {
      const raw     = row.dimensionValues[0].value; // "20260201"
      const channel = row.dimensionValues[1].value;
      const date    = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
      if (!channelsByDate[channel]) channelsByDate[channel] = [];
      channelsByDate[channel].push({
        date,
        sessions:  parseInt(row.metricValues[0].value, 10),
        users:     parseInt(row.metricValues[1].value, 10),
        pageViews: parseInt(row.metricValues[2].value, 10),
      });
    }

    // Aggregate channel totals for the current month
    const sumRows = (rows = []) =>
      rows.reduce(
        (acc, r) => ({
          sessions:  acc.sessions  + r.sessions,
          users:     acc.users     + r.users,
          pageViews: acc.pageViews + r.pageViews,
        }),
        { sessions: 0, users: 0, pageViews: 0 },
      );

    // ── Parse previous-month rows by channel ──────────────────────────────────
    const prevByChannel = {};
    for (const row of prevByChannelRes.data.rows ?? []) {
      const channel = row.dimensionValues[0].value;
      prevByChannel[channel] = {
        sessions:  parseInt(row.metricValues[0].value, 10),
        users:     parseInt(row.metricValues[1].value, 10),
        pageViews: parseInt(row.metricValues[2].value, 10),
      };
    }

    // ── Build per-channel objects ─────────────────────────────────────────────
    const makeChannel = (name) => ({
      totals:     sumRows(channelsByDate[name]),
      prevTotals: prevByChannel[name] ?? null,
      byDate:     channelsByDate[name] ?? [],
    });

    const organicSocial = makeChannel('Organic Social');
    const direct        = makeChannel('Direct');
    const organicSearch = makeChannel('Organic Search');

    // ── Combined daily series (all 3 channels, for the multi-line chart) ──────
    const allDates = [
      ...new Set([
        ...organicSocial.byDate.map((r) => r.date),
        ...direct.byDate.map((r) => r.date),
        ...organicSearch.byDate.map((r) => r.date),
      ]),
    ].sort();

    const lookup = (rows, date) => rows.find((r) => r.date === date)?.sessions ?? 0;
    const combinedByDate = allDates.map((date) => ({
      date,
      organicSocial: lookup(organicSocial.byDate, date),
      direct:        lookup(direct.byDate, date),
      organicSearch: lookup(organicSearch.byDate, date),
    }));

    // ── Top organic-social sources ────────────────────────────────────────────
    const bySource = (bySourceRes.data.rows ?? []).map((row) => ({
      source:   row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value, 10),
      users:    parseInt(row.metricValues[1].value, 10),
    }));

    res.json({
      organicSocial,
      direct,
      organicSearch,
      combinedByDate,
      bySource,
      // Backward-compat flat fields (organic social) used by UnifiedView
      totals:     organicSocial.totals,
      prevTotals: organicSocial.prevTotals,
      byDate:     organicSocial.byDate,
    });
  } catch (err) {
    console.error('GA4 error:', err.message);
    res.status(502).json({ error: err.message });
  }
}

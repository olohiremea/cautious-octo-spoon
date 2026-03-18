import { google } from 'googleapis';

// Parse service account JSON once at cold-start
let ga4ServiceAccount = null;
try {
  ga4ServiceAccount = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON || 'null');
} catch {
  // Handled inside the handler
}

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

    const organicSocialFilter = {
      filter: {
        fieldName: 'sessionDefaultChannelGrouping',
        stringFilter: { value: 'Organic Social', matchType: 'EXACT' },
      },
    };

    const [byDateRes, bySourceRes, prevTotalsRes] = await Promise.all([
      analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
          ],
          dimensionFilter: organicSocialFilter,
          orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
        },
      }),
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
      analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: prevStart, endDate: prevEnd }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
          ],
          dimensionFilter: organicSocialFilter,
        },
      }),
    ]);

    const byDate = (byDateRes.data.rows ?? []).map((row) => {
      const raw = row.dimensionValues[0].value; // "20260201"
      return {
        date:      `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`,
        sessions:  parseInt(row.metricValues[0].value, 10),
        users:     parseInt(row.metricValues[1].value, 10),
        pageViews: parseInt(row.metricValues[2].value, 10),
      };
    });

    const bySource = (bySourceRes.data.rows ?? []).map((row) => ({
      source:   row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value, 10),
      users:    parseInt(row.metricValues[1].value, 10),
    }));

    const totals = byDate.reduce(
      (acc, r) => ({
        sessions:  acc.sessions  + r.sessions,
        users:     acc.users     + r.users,
        pageViews: acc.pageViews + r.pageViews,
      }),
      { sessions: 0, users: 0, pageViews: 0 },
    );

    const prevRow = prevTotalsRes.data.totals?.[0]?.metricValues;
    const prevTotals = prevRow
      ? {
          sessions:  parseInt(prevRow[0].value, 10),
          users:     parseInt(prevRow[1].value, 10),
          pageViews: parseInt(prevRow[2].value, 10),
        }
      : null;

    res.json({ totals, prevTotals, byDate, bySource });
  } catch (err) {
    console.error('GA4 error:', err.message);
    res.status(502).json({ error: err.message });
  }
}

import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { google } from 'googleapis';

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const PORT = process.env.PORT || 3001;

// Proxy endpoint — key never leaves the server
app.post('/api/gemini', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }
  try {
    const upstream = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: `Upstream error: ${err.message}` });
  }
});

// ── GA4 Data API ─────────────────────────────────────────────────────────────
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
let ga4ServiceAccount = null;
try {
  ga4ServiceAccount = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON || 'null');
} catch {
  console.warn('GA4_SERVICE_ACCOUNT_JSON is not valid JSON — GA4 endpoint will be disabled.');
}

// GET /api/ga4?year=2026&month=2  (month is 1-indexed)
app.get('/api/ga4', async (req, res) => {
  if (!GA4_PROPERTY_ID || GA4_PROPERTY_ID === 'REPLACE_WITH_YOUR_GA4_PROPERTY_ID') {
    return res.status(503).json({ error: 'GA4_PROPERTY_ID is not configured on the server.' });
  }
  if (!ga4ServiceAccount) {
    return res.status(503).json({ error: 'GA4_SERVICE_ACCOUNT_JSON is not configured on the server.' });
  }

  const year  = parseInt(req.query.year,  10);
  const month = parseInt(req.query.month, 10); // 1-indexed
  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Provide valid year and month (1–12) query params.' });
  }

  // Build date range for the requested month
  const pad = (n) => String(n).padStart(2, '0');
  const startDate = `${year}-${pad(month)}-01`;
  const lastDay   = new Date(year, month, 0).getDate();
  const endDate   = `${year}-${pad(month)}-${pad(lastDay)}`;

  // Previous month (for MoM comparison)
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

    // Run three reports in parallel
    const [byDateRes, bySourceRes, prevTotalsRes] = await Promise.all([
      // Sessions by date (for the time-series chart)
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
      // Sessions by source (for the breakdown chart)
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
      // Previous month totals (for MoM change cards)
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

    // Parse by-date rows → [{ date: "2026-02-01", sessions, users, pageViews }]
    const byDate = (byDateRes.data.rows ?? []).map((row) => {
      const raw = row.dimensionValues[0].value; // "20260201"
      const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
      return {
        date,
        sessions:  parseInt(row.metricValues[0].value, 10),
        users:     parseInt(row.metricValues[1].value, 10),
        pageViews: parseInt(row.metricValues[2].value, 10),
      };
    });

    // Parse by-source rows → [{ source, sessions, users }]
    const bySource = (bySourceRes.data.rows ?? []).map((row) => ({
      source:   row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value, 10),
      users:    parseInt(row.metricValues[1].value, 10),
    }));

    // Aggregate totals for the current month
    const totals = byDate.reduce(
      (acc, r) => ({
        sessions:  acc.sessions  + r.sessions,
        users:     acc.users     + r.users,
        pageViews: acc.pageViews + r.pageViews,
      }),
      { sessions: 0, users: 0, pageViews: 0 },
    );

    // Previous month totals
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
});

// Serve built frontend in production
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, 'dist')));
app.get('*', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

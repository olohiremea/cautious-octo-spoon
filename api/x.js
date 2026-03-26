import { TwitterApi } from 'twitter-api-v2';

// OAuth 1.0a client — required for non_public_metrics (impressions)
// Falls back to app-only (bearer token) if user credentials are absent,
// but impressions will be unavailable in that mode.
function makeClient() {
  const {
    X_BEARER_TOKEN,
    X_CONSUMER_KEY,
    X_CONSUMER_SECRET,
    X_ACCESS_TOKEN,
    X_ACCESS_TOKEN_SECRET,
  } = process.env;

  if (X_CONSUMER_KEY && X_CONSUMER_SECRET && X_ACCESS_TOKEN && X_ACCESS_TOKEN_SECRET) {
    return new TwitterApi({
      appKey:        X_CONSUMER_KEY,
      appSecret:     X_CONSUMER_SECRET,
      accessToken:   X_ACCESS_TOKEN,
      accessSecret:  X_ACCESS_TOKEN_SECRET,
    });
  }
  if (X_BEARER_TOKEN) {
    return new TwitterApi(X_BEARER_TOKEN);
  }
  return null;
}

// Resolve the target user ID — prefers the explicit X_USER_ID env var,
// falls back to looking up X_USERNAME. Result is cached in-process.
let _cachedUserId = null;
async function resolveUserId(client) {
  if (_cachedUserId) return _cachedUserId;
  if (process.env.X_USER_ID) {
    _cachedUserId = process.env.X_USER_ID;
    return _cachedUserId;
  }
  const username = (process.env.X_USERNAME || '').replace(/^@/, '');
  if (!username) return null;
  const res = await client.v2.userByUsername(username);
  if (res.data?.id) {
    _cachedUserId = res.data.id;
  }
  return _cachedUserId;
}

// Return the ISO week number (Mon–Sun) for a given Date
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = makeClient();
  if (!client) {
    return res.status(503).json({
      error:
        'X API credentials are not configured. Add X_BEARER_TOKEN (and optionally X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET) to your environment variables.',
    });
  }

  const X_USER_ID = await resolveUserId(client);
  if (!X_USER_ID) {
    return res.status(503).json({
      error:
        'Set X_USER_ID (numeric) or X_USERNAME in your environment variables so the endpoint knows which account to track.',
    });
  }

  const year  = parseInt(req.query.year,  10);
  const month = parseInt(req.query.month, 10); // 1-indexed
  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Provide valid year and month (1–12) query params.' });
  }

  const pad       = (n) => String(n).padStart(2, '0');
  const startDate = new Date(`${year}-${pad(month)}-01T00:00:00Z`);
  const endDate   = new Date(year, month, 0); // last day of month
  endDate.setUTCHours(23, 59, 59, 999);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;

  // Determine which tweet.fields we can request
  const hasUserContext = !!(
    process.env.X_CONSUMER_KEY &&
    process.env.X_ACCESS_TOKEN
  );

  const tweetFields = [
    'created_at',
    'public_metrics',
    ...(hasUserContext ? ['non_public_metrics'] : []),
  ];

  try {
    const rwClient = client.readOnly ?? client;

    // ── Fetch user profile ───────────────────────────────────────────────────
    const userRes = await rwClient.v2.user(X_USER_ID, {
      'user.fields': ['public_metrics', 'username', 'name'],
    });
    const user = userRes.data;
    const followers = user.public_metrics.followers_count;

    // ── Fetch tweets for current month ──────────────────────────────────────
    const tweetsRes = await rwClient.v2.userTimeline(X_USER_ID, {
      start_time:   startDate.toISOString(),
      end_time:     endDate.toISOString(),
      max_results:  100,
      'tweet.fields': tweetFields,
      exclude:      'retweets,replies',
    });

    const tweets = tweetsRes.data.data ?? [];

    // ── Fetch previous month follower count via tweets (approx) ─────────────
    // X API doesn't expose historical follower counts; we expose null so the
    // frontend can decide how to handle it.
    const prevFollowers = null;

    // ── Aggregate monthly totals ─────────────────────────────────────────────
    let totalImpressions = 0;
    let totalLikes       = 0;
    let totalRetweets    = 0;
    let totalReplies     = 0;
    let totalEngagements = 0;

    const tweetList = tweets.map((t) => {
      const pub  = t.public_metrics ?? {};
      const priv = t.non_public_metrics ?? {};

      const impressions  = priv.impression_count  ?? null;
      const likes        = pub.like_count          ?? 0;
      const retweets     = pub.retweet_count       ?? 0;
      const replies      = pub.reply_count         ?? 0;
      const quotes       = pub.quote_count         ?? 0;
      const engagements  = likes + retweets + replies + quotes;
      const engagementRate = impressions ? (engagements / impressions) * 100 : null;

      if (impressions  != null) totalImpressions += impressions;
      totalLikes       += likes;
      totalRetweets    += retweets;
      totalReplies     += replies;
      totalEngagements += engagements;

      return {
        id:              t.id,
        createdAt:       t.created_at,
        impressions,
        likes,
        retweets,
        replies,
        quotes,
        engagements,
        engagementRate,
      };
    });

    const tweetsPublished  = tweetList.length;
    const avgImpressions   = tweetsPublished > 0 && totalImpressions > 0
      ? Math.round(totalImpressions / tweetsPublished)
      : null;
    const overallEngRate   = totalImpressions > 0
      ? (totalEngagements / totalImpressions) * 100
      : null;

    // ── Build weekly series ──────────────────────────────────────────────────
    const weeklyMap = {};
    for (const t of tweetList) {
      const d   = new Date(t.createdAt);
      const key = `${d.getUTCFullYear()}-W${pad(isoWeek(d))}`;
      if (!weeklyMap[key]) {
        weeklyMap[key] = { week: key, impressions: 0, engagements: 0, tweets: 0 };
      }
      weeklyMap[key].tweets++;
      if (t.impressions != null) weeklyMap[key].impressions += t.impressions;
      weeklyMap[key].engagements += t.engagements;
    }
    const weekly = Object.values(weeklyMap).sort((a, b) =>
      a.week.localeCompare(b.week),
    );

    res.json({
      profile: {
        userId:      X_USER_ID,
        username:    user.username,
        name:        user.name,
        followers,
        prevFollowers,
      },
      monthly: {
        year,
        month,
        tweetsPublished,
        impressions:     totalImpressions || null,
        likes:           totalLikes,
        retweets:        totalRetweets,
        replies:         totalReplies,
        engagements:     totalEngagements,
        avgImpressions,
        engagementRate:  overallEngRate,
        impressionsAvailable: hasUserContext,
      },
      weekly,
      tweets: tweetList,
      prevMonth: {
        year:  prevYear,
        month: prevMonth,
      },
    });
  } catch (err) {
    console.error('X API error:', err.message);
    res.status(502).json({ error: err.message });
  }
}

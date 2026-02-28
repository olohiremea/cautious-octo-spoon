// ─────────────────────────────────────────────────────────────────────────────
// Mock data — mirrors the exact Google Sheets column structure.
// Replace with live sheet data by setting USE_MOCK_DATA = false in config.js.
// ─────────────────────────────────────────────────────────────────────────────

export const mockAdamWeekly = [
  { Week: '2025-12-06', Followers: 5120, Impressions: 4200, Engagement_Rate: 2.8, Posts_Published: 3, Profile_Views: 178 },
  { Week: '2025-12-13', Followers: 5195, Impressions: 5100, Engagement_Rate: 3.2, Posts_Published: 4, Profile_Views: 224 },
  { Week: '2025-12-20', Followers: 5258, Impressions: 3800, Engagement_Rate: 2.5, Posts_Published: 2, Profile_Views: 152 },
  { Week: '2025-12-27', Followers: 5314, Impressions: 2900, Engagement_Rate: 2.1, Posts_Published: 2, Profile_Views: 129 },
  { Week: '2026-01-03', Followers: 5392, Impressions: 5500, Engagement_Rate: 3.5, Posts_Published: 4, Profile_Views: 248 },
  { Week: '2026-01-10', Followers: 5481, Impressions: 6200, Engagement_Rate: 3.8, Posts_Published: 5, Profile_Views: 293 },
  { Week: '2026-01-17', Followers: 5583, Impressions: 5800, Engagement_Rate: 3.6, Posts_Published: 4, Profile_Views: 271 },
  { Week: '2026-01-24', Followers: 5692, Impressions: 6800, Engagement_Rate: 4.1, Posts_Published: 5, Profile_Views: 318 },
  { Week: '2026-01-31', Followers: 5798, Impressions: 5200, Engagement_Rate: 3.3, Posts_Published: 3, Profile_Views: 237 },
  { Week: '2026-02-07', Followers: 5951, Impressions: 7200, Engagement_Rate: 4.5, Posts_Published: 5, Profile_Views: 382 },
  { Week: '2026-02-14', Followers: 6104, Impressions: 7800, Engagement_Rate: 4.8, Posts_Published: 5, Profile_Views: 421 },
  { Week: '2026-02-21', Followers: 6223, Impressions: 6500, Engagement_Rate: 4.2, Posts_Published: 4, Profile_Views: 347 },
];

export const mockChoreWeekly = [
  { Week: '2025-12-06', Followers: 2012, Impressions: 1820, Engagement_Rate: 1.9, Posts_Published: 2 },
  { Week: '2025-12-13', Followers: 2051, Impressions: 2140, Engagement_Rate: 2.2, Posts_Published: 2 },
  { Week: '2025-12-20', Followers: 2082, Impressions: 1620, Engagement_Rate: 1.7, Posts_Published: 1 },
  { Week: '2025-12-27', Followers: 2105, Impressions: 1200, Engagement_Rate: 1.5, Posts_Published: 1 },
  { Week: '2026-01-03', Followers: 2143, Impressions: 2380, Engagement_Rate: 2.5, Posts_Published: 2 },
  { Week: '2026-01-10', Followers: 2196, Impressions: 2810, Engagement_Rate: 2.8, Posts_Published: 3 },
  { Week: '2026-01-17', Followers: 2252, Impressions: 2640, Engagement_Rate: 2.6, Posts_Published: 2 },
  { Week: '2026-01-24', Followers: 2314, Impressions: 3080, Engagement_Rate: 3.0, Posts_Published: 3 },
  { Week: '2026-01-31', Followers: 2371, Impressions: 2430, Engagement_Rate: 2.4, Posts_Published: 2 },
  { Week: '2026-02-07', Followers: 2452, Impressions: 3420, Engagement_Rate: 3.2, Posts_Published: 3 },
  { Week: '2026-02-14', Followers: 2543, Impressions: 3780, Engagement_Rate: 3.5, Posts_Published: 3 },
  { Week: '2026-02-21', Followers: 2614, Impressions: 3200, Engagement_Rate: 3.0, Posts_Published: 2 },
];

export const mockAdamPosts = [
  { Date: '2026-02-24', Post_Preview: 'Just shipped a new feature that reduces load time by 40%. Engineering is all about...', Impressions: 1920, Likes: 91, Comments: 16, Reposts: 9 },
  { Date: '2026-02-21', Post_Preview: 'The best teams I\'ve built share one trait — they celebrate small wins loudly and...', Impressions: 2340, Likes: 114, Comments: 22, Reposts: 13 },
  { Date: '2026-02-19', Post_Preview: '3 years ago I almost quit. Today we crossed 1,000 paying customers. Here\'s the...', Impressions: 3870, Likes: 198, Comments: 41, Reposts: 28 },
  { Date: '2026-02-17', Post_Preview: 'Hot take: Most startup post-mortems miss the actual cause of failure. It\'s never...', Impressions: 2150, Likes: 103, Comments: 31, Reposts: 18 },
  { Date: '2026-02-14', Post_Preview: 'What I learned from reading 52 books last year (ranked by impact on my thinking):', Impressions: 4210, Likes: 221, Comments: 48, Reposts: 35 },
  { Date: '2026-02-12', Post_Preview: 'Unpopular opinion: your product roadmap should be half the length you think it...', Impressions: 1680, Likes: 79, Comments: 19, Reposts: 11 },
  { Date: '2026-02-10', Post_Preview: 'We ran a radical transparency experiment with our investors. Here\'s what happened...', Impressions: 2980, Likes: 148, Comments: 37, Reposts: 22 },
  { Date: '2026-02-07', Post_Preview: 'The hiring mistake every founder makes (and how to avoid it at series A stage):', Impressions: 3210, Likes: 162, Comments: 44, Reposts: 27 },
  { Date: '2026-02-05', Post_Preview: 'Closed our seed round. Lessons from 47 investor calls in 6 weeks that no one...', Impressions: 5140, Likes: 273, Comments: 62, Reposts: 41 },
  { Date: '2026-02-03', Post_Preview: 'AI replaced 3 tasks on my team. Here\'s what we hired humans to do instead — and...', Impressions: 2640, Likes: 128, Comments: 29, Reposts: 16 },
  { Date: '2026-01-31', Post_Preview: 'January retrospective: what worked, what didn\'t, and our biggest surprise of the...', Impressions: 1840, Likes: 87, Comments: 21, Reposts: 12 },
  { Date: '2026-01-28', Post_Preview: 'The one question I ask every candidate that reveals more than any technical test:', Impressions: 3120, Likes: 156, Comments: 38, Reposts: 24 },
  { Date: '2026-01-25', Post_Preview: 'Revenue transparency post: we made $48K in December. Full breakdown inside →', Impressions: 4450, Likes: 234, Comments: 57, Reposts: 39 },
  { Date: '2026-01-22', Post_Preview: 'Stop writing "passionate" on your LinkedIn bio. Here\'s what actually makes someone...', Impressions: 2820, Likes: 138, Comments: 33, Reposts: 19 },
  { Date: '2026-01-19', Post_Preview: 'We almost didn\'t ship this feature. Turns out it became our highest-rated by...', Impressions: 1760, Likes: 84, Comments: 18, Reposts: 10 },
  { Date: '2026-01-17', Post_Preview: 'Framework: how I decide which meetings to attend vs. which to delegate in a week...', Impressions: 2290, Likes: 112, Comments: 27, Reposts: 15 },
  { Date: '2026-01-14', Post_Preview: 'Burned out at 28 running my first company. Here\'s the thing nobody tells you about...', Impressions: 6720, Likes: 354, Comments: 89, Reposts: 61 },
  { Date: '2026-01-12', Post_Preview: 'Our NPS went from 32 to 71 in 6 months. The change that made the biggest impact...', Impressions: 2140, Likes: 104, Comments: 26, Reposts: 14 },
  { Date: '2026-01-10', Post_Preview: 'Thread: the 5 metrics I track weekly that actually predict company health (not...)', Impressions: 3540, Likes: 178, Comments: 43, Reposts: 29 },
  { Date: '2026-01-07', Post_Preview: 'New year, new strategy. Here\'s how we\'re approaching Q1 differently than every...', Impressions: 2780, Likes: 135, Comments: 32, Reposts: 18 },
];

export const mockChorePosts = [
  { Date: '2026-02-22', Post_Preview: 'Introducing Chore 2.0 — the biggest update we\'ve shipped in two years. Here\'s...', Impressions: 1480, Likes: 67, Comments: 12, Reposts: 8 },
  { Date: '2026-02-19', Post_Preview: 'Customer story: how a 5-person team at @Acme cut their admin time by 60% using...', Impressions: 1820, Likes: 83, Comments: 14, Reposts: 9 },
  { Date: '2026-02-15', Post_Preview: 'We\'re hiring! Looking for a senior product designer who loves systems thinking...', Impressions: 2140, Likes: 96, Comments: 22, Reposts: 11 },
  { Date: '2026-02-12', Post_Preview: 'Why most team productivity tools fail (and what we designed Chore to do instead):', Impressions: 1340, Likes: 58, Comments: 9, Reposts: 5 },
  { Date: '2026-02-08', Post_Preview: 'We crossed 500 active teams on Chore this month. Thank you to every customer who...', Impressions: 2680, Likes: 124, Comments: 31, Reposts: 19 },
  { Date: '2026-02-05', Post_Preview: 'New integration: Chore now syncs with Jira, Linear, and GitHub Issues automatically...', Impressions: 1960, Likes: 88, Comments: 17, Reposts: 12 },
  { Date: '2026-02-01', Post_Preview: 'January wrap-up: Chore helped teams complete 127,000 tasks. Here\'s what surprised...', Impressions: 1620, Likes: 74, Comments: 13, Reposts: 7 },
  { Date: '2026-01-28', Post_Preview: 'Webinar recap: 5 workflow patterns from our top-performing teams (recording inside):', Impressions: 1240, Likes: 56, Comments: 8, Reposts: 4 },
  { Date: '2026-01-24', Post_Preview: 'The accountability loop: how Chore\'s weekly review feature helped one team cut...', Impressions: 1780, Likes: 81, Comments: 16, Reposts: 10 },
  { Date: '2026-01-21', Post_Preview: 'Behind the product: why we scrapped our notification system and rebuilt it from...', Impressions: 1420, Likes: 64, Comments: 11, Reposts: 6 },
  { Date: '2026-01-17', Post_Preview: 'Case study: @GrowthCo went from 12% task completion to 89% in 30 days. Their...', Impressions: 2080, Likes: 97, Comments: 23, Reposts: 14 },
  { Date: '2026-01-14', Post_Preview: 'Q1 product roadmap is live! Here\'s what we\'re shipping in the next 90 days →', Impressions: 2360, Likes: 108, Comments: 27, Reposts: 16 },
  { Date: '2026-01-10', Post_Preview: 'We analyzed 10,000 tasks across 200 teams. The pattern that predicts team burnout...', Impressions: 1640, Likes: 74, Comments: 14, Reposts: 8 },
  { Date: '2026-01-07', Post_Preview: 'Meet our new head of customer success! Excited to welcome Sarah to the Chore team...', Impressions: 1180, Likes: 53, Comments: 19, Reposts: 5 },
];

export const mockGoals = [
  { Account: 'Adam', Metric: 'Followers_Growth', Monthly_Goal: 450 },
  { Account: 'Adam', Metric: 'Impressions', Monthly_Goal: 24000 },
  { Account: 'Adam', Metric: 'Engagement_Rate', Monthly_Goal: 3.5 },
  { Account: 'Adam', Metric: 'Posts_Published', Monthly_Goal: 15 },
  { Account: 'Adam', Metric: 'Profile_Views', Monthly_Goal: 1100 },
  { Account: 'Chore', Metric: 'Followers_Growth', Monthly_Goal: 220 },
  { Account: 'Chore', Metric: 'Impressions', Monthly_Goal: 11000 },
  { Account: 'Chore', Metric: 'Engagement_Rate', Monthly_Goal: 2.8 },
  { Account: 'Chore', Metric: 'Posts_Published', Monthly_Goal: 10 },
];

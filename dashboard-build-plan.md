# Marketing Analytics Dashboard — Complete Build Plan

**How to build a multi-channel marketing dashboard with LinkedIn metrics (via Google Sheets), website traffic (Google Analytics 4), CRM data (Pipedrive or any REST CRM), goals tracking, and health scores.**

---

## Table of Contents

1. [What You're Building](#1-what-youre-building)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [External Setup (No Coding Required)](#4-external-setup-no-coding-required)
   - 4.1 Google Sheets — LinkedIn Data
   - 4.2 Google Sheets — Goals
   - 4.3 Google Analytics 4 — Service Account
   - 4.4 CRM API Credentials
   - 4.5 Vercel Account
5. [Phase 1 — Project Bootstrap](#5-phase-1--project-bootstrap)
6. [Phase 2 — Google Sheets Data Layer](#6-phase-2--google-sheets-data-layer)
7. [Phase 3 — LinkedIn Dashboard](#7-phase-3--linkedin-dashboard)
8. [Phase 4 — Google Analytics 4 Integration](#8-phase-4--google-analytics-4-integration)
9. [Phase 5 — CRM Integration](#9-phase-5--crm-integration)
10. [Phase 6 — Goals & Health Scores](#10-phase-6--goals--health-scores)
11. [Phase 7 — Unified Overview](#11-phase-7--unified-overview)
12. [Phase 8 — Deployment to Vercel](#12-phase-8--deployment-to-vercel)
13. [Adding More Channels Later](#13-adding-more-channels-later)
14. [Full Prompts Reference](#14-full-prompts-reference)
15. [Troubleshooting Reference](#15-troubleshooting-reference)

---

## 1. What You're Building

A single-page, dark-themed analytics dashboard that shows:

| Section | Data Source | Update frequency |
|---|---|---|
| LinkedIn metrics (followers, impressions, engagement) | Google Sheets (you fill manually) | Weekly |
| LinkedIn post performance | Google Sheets | Per post |
| Website traffic by channel | Google Analytics 4 API | On demand |
| Traffic → demo/booking page funnel | Google Analytics 4 API | On demand |
| CRM pipeline (leads, appointments, conversions) | CRM REST API (Pipedrive etc.) | On demand |
| Goals vs actuals + on-track badges | Google Sheets | Monthly |
| Health score rings per account/channel | Computed | Real-time |
| Unified "at a glance" overview | All sources | On demand |

The dashboard has no database. It reads live from Google Sheets (public, no auth) and fetches from APIs through a lightweight backend that keeps your secrets safe.

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev server, small bundle |
| Styling | Tailwind CSS | Utility classes, dark theme easy |
| Charts | Recharts | Works well with React, good defaults |
| Backend | Express.js (dev) / Vercel serverless (prod) | Proxies API calls so secrets never reach the browser |
| LinkedIn data | Google Sheets GViz API | No LinkedIn API needed — you enter data manually |
| Website traffic | Google Analytics 4 Data API v1beta | Official API, generous free tier |
| CRM | REST API of your CRM | Pipedrive, HubSpot, Salesforce, etc. |
| Deployment | Vercel | Free hobby tier, auto-deploys from GitHub |

---

## 3. Prerequisites

Before writing a single line of code, make sure you have:

- **Node.js 18 or later** — download at nodejs.org
- **Git** — download at git-scm.com
- **A GitHub account** — free at github.com
- **A Google account** — for Google Sheets and Google Cloud
- **A Vercel account** — free at vercel.com, sign in with GitHub
- **Your CRM credentials** — API token or OAuth app (details in Section 4.4)
- **Claude Code** — installed with `npm install -g @anthropic-ai/claude-code`

> **Time estimate for setup (Sections 3–4):** 45–90 minutes, mostly waiting for Google Cloud to propagate permissions.

---

## 4. External Setup (No Coding Required)

### 4.1 Google Sheets — LinkedIn Data

This sheet is your LinkedIn data store. Because the LinkedIn API requires a partner approval process that takes months, you enter the numbers yourself each week. It takes about 5 minutes per account per week.

#### Create the spreadsheet

1. Go to **sheets.google.com** and create a new spreadsheet.
2. Name it something like **"Marketing Dashboard Data"**.
3. Create one sheet tab per LinkedIn account (e.g. `Adam_Weekly`, `Chore_Weekly`).

#### Weekly sheet structure

Each weekly tab needs these exact column headers in row 1:

```
Week | Followers | Impressions | Engagement_Rate | Posts_Published | Profile_Views | ICP_Connection_Requests
```

- **Week** — the Monday date of that week, formatted as a date (e.g. 21/04/2026). Google Sheets' GViz API sends dates as `Date(2026,3,21)` — the dashboard handles this automatically.
- **Followers** — total follower count at the end of that week (cumulative, not growth)
- **Impressions** — total impressions for that week
- **Engagement_Rate** — decimal fraction, e.g. `0.035` for 3.5%
- **Posts_Published** — number of posts published that week
- **Profile_Views** — profile views that week
- **ICP_Connection_Requests** — connection requests sent to your Ideal Customer Profile that week

#### Monthly sheet structure

Create tabs `Adam_Monthly` and `Chore_Monthly` with:

```
Month | Followers | Impressions | Engagement_Rate | Posts_Published | Profile_Views
```

- **Month** — first day of the month as a date (e.g. 01/04/2026)

#### Posts sheet structure

Create tabs `Adam_Posts` and `Chore_Posts` with:

```
Date | Post_Text | Impressions | Likes | Comments | Reposts | Engagement_Rate | Post_Type | Topic
```

- **Date** — the date published
- **Post_Type** — e.g. "Text", "Image", "Carousel", "Video"
- **Engagement_Rate** — decimal (e.g. `0.042`)

#### Make the spreadsheet public

This is essential — the dashboard reads it without authentication.

1. Click **Share** (top right).
2. Click **"Anyone with the link"** and set to **Viewer**.
3. Copy the spreadsheet URL. It looks like:
   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
4. Keep note of the `SPREADSHEET_ID` (the long string between `/d/` and `/edit`).

#### Get the GViz base URL

The dashboard uses the Google Visualization API to read sheets. The URL pattern is:

```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/gviz/tq?tqx=out:json&sheet=SHEET_NAME
```

Replace `SPREADSHEET_ID` with your ID and `SHEET_NAME` with the tab name (URL-encoded if it has spaces).

---

### 4.2 Google Sheets — Goals

Add a new tab to the same spreadsheet called **`Goals`** with exactly these column headers:

```
Account | Metric | Monthly_Goal
```

Each row is one goal. Examples:

| Account | Metric | Monthly_Goal |
|---|---|---|
| Adam | Followers_Growth | 450 |
| Adam | Impressions | 24000 |
| Adam | Engagement_Rate | 3.5 |
| Adam | Posts_Published | 15 |
| Adam | Profile_Views | 1100 |
| Chore | Followers_Growth | 220 |
| Chore | Impressions | 11000 |
| Website | Organic_Social_Users | 800 |
| Website | Direct_Users | 400 |
| Website | Organic_Search_Users | 600 |

**Important:** The `Account` and `Metric` values are matched case-insensitively, so `website` and `Website` both work. `Monthly_Goal` must be a number.

You can add goals for any channel at any time — just add a new row.

---

### 4.3 Google Analytics 4 — Service Account

The dashboard reads GA4 via a server-side service account. This keeps your credentials off the browser.

#### Step 1: Create a Google Cloud project

1. Go to **console.cloud.google.com**.
2. Click the project selector at the top → **New Project**.
3. Name it (e.g. "Marketing Dashboard") and click **Create**.
4. Make sure the new project is selected.

#### Step 2: Enable the GA4 Data API

1. In the left menu, go to **APIs & Services → Library**.
2. Search for **"Google Analytics Data API"**.
3. Click it and click **Enable**.

#### Step 3: Create a service account

1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → Service Account**.
3. Name it (e.g. "dashboard-reader"), click **Create and Continue**.
4. For role, select **Viewer** (or skip — GA4 permissions are managed separately).
5. Click **Done**.

#### Step 4: Create and download a JSON key

1. Click on the service account you just created.
2. Go to the **Keys** tab.
3. Click **Add Key → Create new key → JSON**.
4. A `.json` file downloads — **keep this safe, treat it like a password**.

#### Step 5: Add the service account to GA4

1. Go to **analytics.google.com**.
2. Open your property → **Admin** (gear icon).
3. Under **Property**, click **Property Access Management**.
4. Click the **+** button → **Add users**.
5. Paste the service account email (looks like `dashboard-reader@your-project.iam.gserviceaccount.com`).
6. Set role to **Viewer**.
7. Click **Add**.

#### Step 6: Get your GA4 Property ID

1. In GA4 Admin, click **Property Settings**.
2. Copy the **Property ID** — it's a number like `123456789`.

#### What you'll add to your `.env`

```
GA4_PROPERTY_ID=123456789
GA4_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}
```

The service account JSON goes in as a single-line string (minify it with `jq -c . key.json`).

---

### 4.4 CRM API Credentials

#### Pipedrive

1. Log into Pipedrive.
2. Go to **Settings → Personal preferences → API**.
3. Copy your **Personal API token**.

```
PIPEDRIVE_API_TOKEN=your_token_here
```

#### HubSpot

1. Go to **Settings → Integrations → Private Apps**.
2. Click **Create a private app**.
3. Name it "Marketing Dashboard".
4. Under **Scopes**, add: `crm.objects.deals.read`, `crm.objects.contacts.read`.
5. Click **Create app** and copy the access token.

```
HUBSPOT_ACCESS_TOKEN=pat-na1-...
```

#### Salesforce

1. Go to **Setup → App Manager → New Connected App**.
2. Enable OAuth, add scopes `api` and `refresh_token`.
3. Save and copy the **Consumer Key** and **Consumer Secret**.
4. Use the username-password OAuth flow for a server-side token.

```
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...
SALESFORCE_USERNAME=...
SALESFORCE_PASSWORD=...
SALESFORCE_SECURITY_TOKEN=...
```

---

### 4.5 Vercel Account

1. Go to **vercel.com** and sign up with GitHub.
2. You don't need to do anything else yet — you'll connect it in Phase 8.

---

## 5. Phase 1 — Project Bootstrap

Open your terminal in the folder where you want to create the project, then open Claude Code with `claude`.

### Prompt 1 — Create the project

```
Create a new marketing analytics dashboard project from scratch.

Tech stack:
- React 18 + Vite (use `npm create vite@latest . -- --template react`)
- Tailwind CSS v3
- Recharts for data visualisation
- Express.js as a local dev API server
- concurrently to run Vite and Express together

Folder structure I want:
- /src/components — React components
- /src/hooks — custom hooks
- /src/utils — helper functions
- /api — Express route handlers (one file per data source)
- server.js — Express server that mounts files from /api

The Express server should:
- Run on port 3001
- Proxy all /api/* routes to the handlers in /api/
- Never expose environment variables to the client

The Vite dev server should proxy /api/* to localhost:3001 in vite.config.js.

Create a package.json script "dev" that runs both Vite and Express with concurrently.

Create a .env.example file listing all the environment variables the project will need:
- SPREADSHEET_ID
- GA4_PROPERTY_ID
- GA4_SERVICE_ACCOUNT_JSON
- PIPEDRIVE_API_TOKEN

Create a .gitignore that includes .env and node_modules.

Use a dark slate colour scheme (slate-900 background). Install and configure Tailwind.

After creating the project, confirm what was created and what the dev command is.
```

### After running Prompt 1

1. Run `npm install` if it didn't run automatically.
2. Create your `.env` file: `cp .env.example .env`
3. Fill in your `SPREADSHEET_ID` from Section 4.1.
4. Run `npm run dev` — you should see the Vite dev server start.

---

## 6. Phase 2 — Google Sheets Data Layer

### Prompt 2 — Sheet config and data hook

```
I have a Google Sheets spreadsheet (public, viewer access) that I'll use as a data source for LinkedIn metrics. The spreadsheet ID is in the SPREADSHEET_ID environment variable.

The Google Visualization API (GViz) can read public sheets without authentication at this URL pattern:
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/gviz/tq?tqx=out:json&sheet=SHEET_NAME

The response is JSONP wrapped in: google.visualization.Query.setResponse({...});
Strip the wrapper and parse the JSON. The table has cols (array of {label, id}) and rows (array of {c: [{v: value}]}).

Create:

1. src/config.js — exports SHEET_BASE_URL (built from the env var) and SHEET_NAMES object:
   { WEEKLY: 'Weekly', MONTHLY: 'Monthly', POSTS: 'Posts', GOALS: 'Goals' }
   (I'll tell you the exact tab names later — use these as placeholders)

2. src/hooks/useSheetData.js — a custom React hook that:
   - Fetches all sheet tabs in parallel using Promise.all
   - Parses the GViz JSONP format
   - Returns { data, loading, error, lastUpdated, load }
   - data contains { weekly, monthly, posts, goals } arrays of row objects
   - Handles the GViz date format "Date(YYYY,M,D)" — month is 0-indexed — converting to JS Date
   - Drops rows where every value is null (empty rows at the bottom of the sheet)

3. src/utils/dataHelpers.js — exports:
   - parseLocalDate(str) — handles GViz Date(...), ISO, and US slash formats
   - filterByMonth(rows, year, month) — filters by the Week or Month column
   - currentMonthYM() — returns { year, month } for today
   - lastMonthYM() — returns { year, month } for last month
   - formatNumber(n) — formats with K/M suffixes
```

**After this prompt:** Update `src/config.js` with your actual sheet tab names.

---

## 7. Phase 3 — LinkedIn Dashboard

### Prompt 3 — Main app shell and LinkedIn tab

```
Build the main application shell and a LinkedIn metrics tab.

I track two LinkedIn accounts: "Adam" and "Chore". The Google Sheet has separate weekly tabs for each (Adam_Weekly, Chore_Weekly), monthly tabs (Adam_Monthly, Chore_Monthly), and posts tabs (Adam_Posts, Chore_Posts).

Update src/config.js so SHEET_NAMES has:
  ADAM_WEEKLY, ADAM_MONTHLY, ADAM_POSTS, CHORE_WEEKLY, CHORE_MONTHLY, CHORE_POSTS, GOALS

Update useSheetData.js to fetch all 7 tabs.

Create src/App.jsx with:
- A tab bar: "LinkedIn", "Website Traffic", "Sales", "Overview" (plus any other channels I add later)
- Month/year selector (prev/next arrows, defaults to current month)
- A "Refresh data" button that re-fetches everything
- "Last updated" timestamp
- Dark slate-900 background, slate-800 cards, white/slate-100 text

Create src/components/AccountTab.jsx that shows one LinkedIn account. It should display:
- KPI cards in a grid: Current Followers, Follower Growth, Impressions, Avg Engagement Rate, Posts Published, Profile Views
- A follower growth line chart (week by week for the selected month)
- An impressions line chart
- A posts table showing each post's text (truncated), impressions, likes, engagement rate, post type

All metrics should be filtered to the selected month/year.

Add a "vs last month" percentage change on each KPI card in green (positive) or red (negative).

The LinkedIn tab shows both accounts side by side on desktop, stacked on mobile.
```

### Prompt 3b — Add loading and error states

```
Add proper loading and error states throughout the app.

Create src/components/LoadingSkeleton.jsx — a pulsing grey skeleton that mimics the card layout.
Create src/components/ErrorState.jsx — shows the error message with a "Retry" button.

Use these in AccountTab and any future data-dependent component.
```

---

## 8. Phase 4 — Google Analytics 4 Integration

### Prompt 4 — GA4 backend route

```
Create a GA4 backend route at api/ga4.js.

It should:
- Use the `googleapis` npm package (install it)
- Authenticate using GA4_SERVICE_ACCOUNT_JSON (parse from env, handle invalid JSON gracefully)
- Use GA4_PROPERTY_ID from env
- Accept ?year=YYYY&month=M (1-indexed) query params
- Return 503 with a clear message if either env var is missing

Fetch the following in parallel using Promise.all:
1. Sessions by date × channel grouping for the current month, for these channels only: "Organic Social", "Direct", "Organic Search". Metrics: sessions, totalUsers, screenPageViews.
2. Top 10 sources within Organic Social (sessionSource dimension, sessions + users metrics).
3. Same channel breakdown but for the previous month (for month-on-month comparison).

Parse the results into per-channel objects each containing:
- totals: { sessions, users, pageViews } — summed for the month
- prevTotals: { sessions, users, pageViews } — from previous month query
- byDate: [{ date: "YYYY-MM-DD", sessions, users, pageViews }]

Return:
{
  organicSocial, direct, organicSearch,  (each has totals, prevTotals, byDate)
  combinedByDate,  (array of { date, organicSocial, direct, organicSearch } — sessions by date for each channel)
  bySource         (array of { source, sessions, users } — top organic social sources)
}

Register this handler in server.js as GET /api/ga4.
```

### Prompt 4b — GA4 frontend

```
Create src/hooks/useGA4Data.js — mirrors the sheet hook pattern, fetches /api/ga4?year=Y&month=M, returns { data, loading, error, refresh }.

Create src/components/WebTrafficTab.jsx that shows:
- Three channel cards (Organic Social, Direct, Organic Search) each showing sessions, users, page views, and % change vs previous month
- A multi-line chart showing sessions by week across all three channels
- A horizontal bar chart showing top organic social sources

Use Recharts for all charts. Use these channel colours:
- Organic Social: #34d399 (emerald)
- Direct: #60a5fa (blue)
- Organic Search: #fbbf24 (amber)

Wire the WebTrafficTab into App.jsx on the "Website Traffic" tab, passing the selected year and month.
```

---

## 9. Phase 5 — CRM Integration

This section uses Pipedrive as the example. The pattern is identical for any REST CRM — only the API calls change. Notes for HubSpot and Salesforce are at the end of this section.

### Prompt 5 — Pipedrive backend route

```
Create api/pipedrive.js — a backend route for Pipedrive CRM data.

Use PIPEDRIVE_API_TOKEN from env. Base URL is https://api.pipedrive.com/v1.

Create a helper that paginates through all pages of any endpoint using start/limit params (Pipedrive returns additional_data.pagination.more_items_in_collection).

Fetch in parallel:
1. All deal fields (GET /dealFields?limit=100) — to find the lead source enum field
2. All deals (GET /deals?status=all_not_deleted) — paginated
3. All pipeline stages (GET /stages) — to find stage names by ID

Source field detection: find the enum/set deal field whose option labels contain the prefixes relevant to your business (e.g. "Referral -", "Paid -", "Inbound -", "Outbound -"). Fall back to a field whose name contains "source" or "channel". Allow override via PIPEDRIVE_SOURCE_FIELD env var.

For the selected month (year + month query params):
- Fresh leads: deals where stage_id = "Fresh Leads" stage AND stage_change_time is in the month
- Appointments held: deals where stage_id = "Appointment Held" stage AND stage_change_time is in the month
- Conversions: deals with status="won" and won_time in the month
- Lost deals: deals with status="lost" and close_time in the month

Return:
{
  leads: { total, freshLeadsStageFound, bySource: [{source, count}], weekly: [{week, leads}] },
  appointmentsHeld: { total, stageFound },
  conversions: { won, lost, conversionRate }
}

The stage names "Fresh Leads" and "Appointment Held" should be matched case-insensitively. If a stage is not found, fall back gracefully (leads falls back to add_time for creation date).

Register as GET /api/pipedrive in server.js.
```

### Prompt 5b — Sales frontend

```
Create src/hooks/usePipedriveData.js — fetches /api/pipedrive?year=Y&month=M (month is 1-indexed). Returns { data, loading, error, refresh }.

Create src/components/SalesTab.jsx showing:

Primary KPI row (4 cards):
- Inbound Leads (leads.total) — subtext: "Deals entered Fresh Leads stage" or a warning if stage not found
- Appointments Held (appointmentsHeld.total)
- Conversions (conversions.won)
- Conversion Rate (conversions.conversionRate as "X%")

Secondary section — Lead Source Breakdown:
- A horizontal bar chart showing leads by source (leads.bySource)

Secondary section — Weekly Lead Trend:
- A bar chart showing leads per week (leads.weekly)

Secondary section — Deal Outcomes:
- A simple donut or bar showing won vs lost deal ratio

Use orange (#f97316) as the primary accent for sales metrics, green (#22c55e) for won deals, red (#ef4444) for lost deals.

Wire SalesTab into App.jsx.
```

### Adapting to HubSpot

Replace `api/pipedrive.js` with a HubSpot version:

```
Create api/hubspot.js — same response shape as the Pipedrive handler.

Use HUBSPOT_ACCESS_TOKEN from env. Use the HubSpot CRM v3 API.
Base URL: https://api.hubapi.com

To get deals: POST /crm/v3/objects/deals/search with filters on pipeline and date ranges.
To get deal stages: GET /crm/v3/pipelines/deals
Paginate using the "after" cursor in the paging.next.after response field.

The "lead source" equivalent in HubSpot is the "hs_analytics_source" or a custom property — detect it the same way as Pipedrive.

Map "Fresh Leads" to your equivalent HubSpot pipeline stage name.
Keep the same response shape so the SalesTab component doesn't need to change.
```

### Adapting to Salesforce

```
Create api/salesforce.js — same response shape.

Use jsforce npm package for Salesforce REST API access.
Authenticate with username-password flow using SALESFORCE_* env vars.

Query deals/opportunities with SOQL:
  SELECT Id, StageName, CreatedDate, CloseDate, Amount, LeadSource FROM Opportunity
  WHERE CloseDate >= :startDate AND CloseDate <= :endDate

Map StageName to "Fresh Leads" and "Appointment Held" equivalents.
Keep the same response shape.
```

---

## 10. Phase 6 — Goals & Health Scores

### Prompt 6 — Goals system

```
Add a goals and health score system.

The Goals sheet tab has three columns: Account, Metric, Monthly_Goal.

Add to src/utils/dataHelpers.js:

findGoal(goals, account, metric):
  - Case-insensitive, whitespace-trimmed match on Account and Metric columns
  - Returns the Monthly_Goal number, or null if not found

isOnTrack(currentValue, monthlyGoal, year, month):
  - If monthlyGoal is null, return null (no goal set)
  - If viewing a past completed month: compare currentValue against the full monthly goal
  - If viewing the current in-progress month: pro-rate the goal based on today's day-of-month
    (e.g. if today is day 15 of 30, the target is 50% of the monthly goal)
  - Returns true (on track) or false (off track)

calculateHealthScore(trackingList):
  - trackingList is an array of booleans and nulls from isOnTrack()
  - Ignore nulls (no goal set)
  - Return percentage of non-null values that are true, rounded to nearest integer
  - Return null if all values are null

Create src/components/GoalBadge.jsx:
  - Accepts onTrack prop (true/false/null)
  - If null, renders nothing
  - If true: green "On Track" pill with a green dot
  - If false: red "Off Track" pill with a red dot

Create src/components/HealthScoreRing.jsx:
  - Circular SVG progress ring showing a score 0-100
  - Colour: green if >= 80, amber if >= 50, red below 50
  - Shows the percentage number in the centre
  - Accepts score, color (brand colour for the label), label props
```

### Prompt 6b — Wire goals into each tab

```
Add goal tracking to each data tab.

In AccountTab.jsx (LinkedIn):
- Call findGoal for each KPI: Followers_Growth, Impressions, Engagement_Rate, Posts_Published, Profile_Views
  (Account = the account name, e.g. "Adam" or "Chore")
- Show a GoalBadge next to each KPI card label
- Show the monthly goal value as small subtext on each card
- Calculate health score with calculateHealthScore and show a HealthScoreRing in the account header
- Pass goals array as a prop from App.jsx

In WebTrafficTab.jsx (GA4):
- findGoal for Account="Website": Organic_Social_Users, Direct_Users, Organic_Search_Users
- Show GoalBadge on the Users metric card for each channel
- Show HealthScoreRing in the tab header
- Pass goals from App.jsx

The goals data comes from useSheetData — pass data?.goals ?? [] down to each tab.
```

---

## 11. Phase 7 — Unified Overview

### Prompt 7 — Unified view

```
Create src/components/UnifiedView.jsx — an "at a glance" overview that shows highlights from every data source on one scrollable page.

Structure:

Section 1 — LinkedIn (both accounts)
- One HealthScoreRing per account in a row
- Follower growth chart (weekly, both accounts on same chart)
- 2-column grid: key KPI cards for Adam | key KPI cards for Chore

Section 2 — Website Traffic
- HealthScoreRing for Website
- Three GA4 channel cards (sessions + users + % change + GoalBadge)
- Multi-line sessions-by-week chart

Section 3 — Sales (CRM)
- 4 KPI cards: Leads, Appointments, Conversions, Conversion Rate

Each section has a subtle divider and section heading. Data comes from the same hooks already used in the individual tabs — no additional fetching needed.

Wire into App.jsx as the "Overview" tab.
```

---

## 12. Phase 8 — Deployment to Vercel

### Prompt 8 — Prepare for Vercel deployment

```
Prepare this project for deployment on Vercel.

Vercel serves serverless functions from an /api directory. The files in /api/*.js need to export a default function handler(req, res) — which they already do. But I also need to remove the Express server for production (Vercel handles routing itself).

Create vercel.json in the project root:
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api/$1" }]
}

Make sure each file in /api/ uses ES module syntax (import/export) and doesn't rely on anything Express-specific beyond the standard (req, res) interface — Vercel's serverless functions are compatible with Express-style handlers.

Update vite.config.js so the Vite proxy only applies in development (it's already conditional on the dev server, but confirm).

Add a build script that runs `vite build` and outputs to /dist.

Create a README section explaining:
1. How to deploy: push to GitHub, connect repo in Vercel dashboard, set env vars
2. List of all required env vars
3. How to update data: just edit the Google Sheet — changes appear on next dashboard refresh
```

### Deploying manually

1. Push your project to GitHub: `git init && git add . && git commit -m "Initial commit" && git remote add origin YOUR_REPO_URL && git push -u origin main`
2. Go to **vercel.com → Add New Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add every key from your `.env` file.
   - For `GA4_SERVICE_ACCOUNT_JSON`: paste the entire contents of the `.json` key file as a single line (no newlines).
5. Click **Deploy**.
6. Every future `git push` to `main` will auto-deploy.

---

## 13. Adding More Channels Later

The architecture is designed for this. Here's the pattern to follow:

### Adding a new data source (e.g. Meta Ads, email, etc.)

1. **Create the backend route** at `api/newchannel.js` — handler(req, res)
2. **Register it** in `server.js`: `app.get('/api/newchannel', newChannelHandler)`
3. **Create a hook** at `src/hooks/useNewChannelData.js`
4. **Create a tab component** at `src/components/NewChannelTab.jsx`
5. **Add a tab button** in `App.jsx`
6. **Add to UnifiedView** if appropriate
7. **Add goals rows** to the Goals sheet with `Account="NewChannel"`

### Prompt for adding a new channel

Copy and adapt this template prompt:

```
Add [CHANNEL NAME] metrics to the dashboard.

API: [BASE URL], authenticated with [AUTH METHOD] using [ENV_VAR_NAME] from env.

Data I want to show:
- [METRIC 1] — fetched from [ENDPOINT]
- [METRIC 2] — fetched from [ENDPOINT]

Create api/[channel].js following the same handler(req, res) pattern as the existing API files. Accept year and month query params. Return clean JSON.

Register in server.js.

Create src/hooks/use[Channel]Data.js following the same pattern as useGA4Data.js.

Create src/components/[Channel]Tab.jsx showing:
- KPI cards for the main metrics
- [CHART TYPE] chart for [METRIC]

Use [PRIMARY COLOUR] as the accent colour.

Add a "[CHANNEL NAME]" tab to App.jsx.

Add the channel's KPI cards to UnifiedView.jsx under a new section heading.
```

### Channels you can add with this pattern

| Channel | API | Key env vars |
|---|---|---|
| Meta Ads | Meta Marketing API v21 | `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` |
| Google Ads | Google Ads API v17 | `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID` |
| Email (Mailchimp) | Mailchimp Marketing API v3 | `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX` |
| Email (ActiveCampaign) | ActiveCampaign API v3 | `ACTIVECAMPAIGN_URL`, `ACTIVECAMPAIGN_API_KEY` |
| YouTube | YouTube Data API v3 | `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` |
| Instagram | Instagram Graph API | `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID` |

> **Note on Meta & Instagram:** Meta requires your app to go through App Review to access page/ad insights for accounts you don't own. For your own business account this is straightforward — apply for `pages_read_engagement`, `ads_read`, and `instagram_basic` permissions.

---

## 14. Full Prompts Reference

Quick reference — all prompts in order:

| # | What it builds | Key outputs |
|---|---|---|
| 1 | Project bootstrap | Vite + React + Tailwind + Express, folder structure, .env |
| 2 | Google Sheets data layer | useSheetData hook, GViz parser, dataHelpers utils |
| 3 | LinkedIn dashboard | AccountTab, KPI cards, charts, month selector |
| 3b | Loading/error states | LoadingSkeleton, ErrorState components |
| 4 | GA4 backend | api/ga4.js, session data by channel |
| 4b | Website traffic UI | useGA4Data, WebTrafficTab, channel cards + charts |
| 5 | CRM backend (Pipedrive) | api/pipedrive.js, stage-based lead/appt counting |
| 5b | Sales UI | usePipedriveData, SalesTab, KPI cards + charts |
| 6 | Goals system | findGoal, isOnTrack, GoalBadge, HealthScoreRing |
| 6b | Wire goals into tabs | Goal badges + health rings in LinkedIn + Website tabs |
| 7 | Unified overview | UnifiedView, all sections in one scrollable page |
| 8 | Vercel deployment | vercel.json, build config, deployment guide |

---

## 15. Troubleshooting Reference

### "Google Sheets returns no data"
- Check the spreadsheet is shared as **Anyone with the link — Viewer**
- Check the tab name exactly matches what's in `SHEET_NAMES` (case-sensitive)
- Open the GViz URL directly in a browser: `https://docs.google.com/spreadsheets/d/YOUR_ID/gviz/tq?tqx=out:json&sheet=Tab_Name`

### "GA4 returns 403 / permission denied"
- Confirm the service account email was added to the GA4 property (Section 4.3, Step 5)
- It can take up to 30 minutes for GA4 permissions to propagate
- Check the `GA4_PROPERTY_ID` doesn't include the `properties/` prefix — just the number

### "GA4_SERVICE_ACCOUNT_JSON causes JSON parse error"
- The value must be on a single line with no newlines
- Run: `cat your-key.json | jq -c .` to minify it before pasting into the env var

### "Pipedrive returns 0 leads"
- The "Fresh Leads" stage name must match exactly (case-insensitive) what's in your Pipedrive pipeline
- Check the stage name with: `curl "https://api.pipedrive.com/v1/stages?api_token=YOUR_TOKEN" | jq '.data[].name'`
- If not found, the dashboard falls back to counting by deal creation date

### "Goals show no badge"
- Check the Account and Metric column values in the Goals sheet match what the code expects
- Values are matched case-insensitively — "website" and "Website" both work
- Make sure Monthly_Goal is a number, not text

### "Works locally but not on Vercel"
- Check every env var is set in **Vercel → Project → Settings → Environment Variables**
- After adding/changing env vars, you must **redeploy** (Vercel doesn't hot-reload env changes)
- Check the Vercel function logs: Vercel dashboard → your project → **Deployments → Functions**

---

## Converting This Document to PDF

**Option A — VS Code:**
Open this file in VS Code → install the "Markdown PDF" extension → right-click → "Markdown PDF: Export (pdf)"

**Option B — Browser:**
Open in any Markdown viewer (github.com, markdownlivepreview.com) → Print → Save as PDF → set margins to "None" or "Minimal"

**Option C — Command line (Pandoc):**
```bash
npm install -g md-to-pdf
md-to-pdf dashboard-build-plan.md
```

---

*Build plan version: May 2026. Based on a working production dashboard using React 18, Vite 5, Tailwind CSS 3, Recharts 2, Google Analytics Data API v1beta, Pipedrive v1 API.*

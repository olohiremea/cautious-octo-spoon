// ─────────────────────────────────────────────────────────────────────────────
// Google Sheets Configuration
// ─────────────────────────────────────────────────────────────────────────────
//
// HOW TO SET UP YOUR GOOGLE SHEET:
// 1. Create a Google Sheet with tabs named:
//    Adam_Weekly | Adam_Monthly | Adam_Posts | Chore_Weekly | Chore_Monthly | Chore_Posts | Goals
// 2. File → Share → Publish to web (publish the entire document as CSV/JSON)
// 3. Paste your Sheet ID below (the long string in the Sheet URL)
//
// Sheet URL format:
//   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
//
// Column structure expected:
//   Adam_Weekly:   Week | Followers | Impressions | Engagement_Rate | Posts_Published | Profile_Views
//   Adam_Monthly:  Week | Impressions | Engagement_Rate | Posts_Published
//   Adam_Posts:    Date | Post_Preview | Impressions | Likes | Comments | Reposts
//   Chore_Weekly:  Week | Followers | Impressions | Engagement_Rate | Posts_Published
//   Chore_Monthly: Week | Impressions | Engagement_Rate
//   Chore_Posts:   Date | Post_Preview | Impressions | Likes | Comments | Reposts
//   Goals:         Account | Metric | Monthly_Goal
// ─────────────────────────────────────────────────────────────────────────────

export const SHEET_ID = '1nUlt9NRPm3ncL3XAL86c4uGbsFn9FA7bMBj_qSYcJMk';

// Base URL for the Google Visualization API (no API key required for public sheets)
export const SHEET_BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=`;

// Sheet tab names (must match exactly)
export const SHEET_NAMES = {
  ADAM_WEEKLY: 'Adam_Weekly',
  ADAM_MONTHLY: 'Adam_Monthly',
  ADAM_POSTS: 'Adam_Posts',
  CHORE_WEEKLY: 'Chore_Weekly',
  CHORE_MONTHLY: 'Chore_Monthly',
  CHORE_POSTS: 'Chore_Posts',
  GOALS: 'Goals',
};

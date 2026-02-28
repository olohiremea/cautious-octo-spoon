import { useState, useCallback } from 'react';
import {
  SHEET_BASE_URL,
  SHEET_NAMES,
  USE_MOCK_DATA,
  SHEET_ID,
} from '../config';
import {
  mockAdamWeekly,
  mockChoreWeekly,
  mockAdamPosts,
  mockChorePosts,
  mockGoals,
} from '../mockData';

// ─────────────────────────────────────────────────────────────────────────────
// Google Visualization API response parser
// ─────────────────────────────────────────────────────────────────────────────

function parseGVizResponse(responseText) {
  // Strip the JSONP wrapper: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const match = responseText.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/);
  if (!match) throw new Error('Unexpected Google Sheets response format');
  const json = JSON.parse(match[1]);

  if (json.status !== 'ok') {
    throw new Error(`Google Sheets error: ${json.errors?.[0]?.message ?? 'Unknown'}`);
  }

  const cols = json.table.cols.map((c) => c.label || c.id);
  const rows = (json.table.rows ?? [])
    .filter((r) => r && r.c)
    .map((r) => {
      const obj = {};
      r.c.forEach((cell, i) => {
        obj[cols[i]] = cell ? cell.v : null;
      });
      return obj;
    })
    // Drop rows where every value is null (empty trailing rows)
    .filter((row) => Object.values(row).some((v) => v !== null));

  return rows;
}

async function fetchSheet(sheetName) {
  const url = `${SHEET_BASE_URL}${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching sheet "${sheetName}"`);
  const text = await res.text();
  return parseGVizResponse(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export default function useSheetData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let sheets;

      if (USE_MOCK_DATA || SHEET_ID === 'YOUR_SHEET_ID_HERE') {
        // Simulate a brief network delay so the loading skeleton is visible
        await new Promise((r) => setTimeout(r, 900));
        sheets = {
          adamWeekly: mockAdamWeekly,
          choreWeekly: mockChoreWeekly,
          adamPosts: mockAdamPosts,
          chorePosts: mockChorePosts,
          goals: mockGoals,
        };
      } else {
        const [adamWeekly, choreWeekly, adamPosts, chorePosts, goals] =
          await Promise.all([
            fetchSheet(SHEET_NAMES.ADAM_WEEKLY),
            fetchSheet(SHEET_NAMES.CHORE_WEEKLY),
            fetchSheet(SHEET_NAMES.ADAM_POSTS),
            fetchSheet(SHEET_NAMES.CHORE_POSTS),
            fetchSheet(SHEET_NAMES.GOALS),
          ]);
        sheets = { adamWeekly, choreWeekly, adamPosts, chorePosts, goals };
      }

      setData(sheets);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, lastUpdated, load };
}

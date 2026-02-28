import { useEffect, useState } from 'react';
import useSheetData from './hooks/useSheetData';
import LoadingSkeleton from './components/LoadingSkeleton';
import ErrorState from './components/ErrorState';
import UnifiedView from './components/UnifiedView';
import AccountTab from './components/AccountTab';
import { USE_MOCK_DATA, SHEET_ID } from './config';

const TABS = [
  { id: 'overview', label: 'Unified View' },
  { id: 'adam', label: "Adam's LinkedIn" },
  { id: 'chore', label: "Chore's LinkedIn" },
];

function LinkedInIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data, loading, error, lastUpdated, load } = useSheetData();

  // Load data on mount
  useEffect(() => {
    load();
  }, [load]);

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-slate-700/60 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo / title */}
            <div className="flex items-center gap-2.5">
              <LinkedInIcon className="h-6 w-6 text-blue-500" />
              <span className="text-base font-bold text-slate-100 tracking-tight">
                LinkedIn Analytics
              </span>
              {(USE_MOCK_DATA || SHEET_ID === 'YOUR_SHEET_ID_HERE') && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
                  Demo Data
                </span>
              )}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3">
              {formattedTime && (
                <span className="hidden sm:block text-xs text-slate-500">
                  Last updated: <span className="text-slate-400">{formattedTime}</span>
                </span>
              )}
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 disabled:opacity-50 transition-colors ring-1 ring-slate-700"
              >
                <RefreshIcon spinning={loading} />
                {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Tab navigation */}
          <nav className="flex gap-0" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none ${
                  activeTab === tab.id
                    ? 'text-slate-100'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-blue-500" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {loading && <LoadingSkeleton />}

        {!loading && error && (
          <ErrorState message={error} onRetry={load} />
        )}

        {!loading && !error && data && (
          <>
            {activeTab === 'overview' && (
              <UnifiedView
                adamWeekly={data.adamWeekly}
                choreWeekly={data.choreWeekly}
                goals={data.goals}
              />
            )}
            {activeTab === 'adam' && (
              <AccountTab
                account="Adam"
                weeklyData={data.adamWeekly}
                postsData={data.adamPosts}
                goals={data.goals}
              />
            )}
            {activeTab === 'chore' && (
              <AccountTab
                account="Chore"
                weeklyData={data.choreWeekly}
                postsData={data.chorePosts}
                goals={data.goals}
              />
            )}
          </>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 mt-8 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-600">
          LinkedIn Analytics Dashboard · Data sourced from Google Sheets ·{' '}
          {USE_MOCK_DATA || SHEET_ID === 'YOUR_SHEET_ID_HERE'
            ? 'Currently showing demo data — update SHEET_ID in src/config.js to connect your sheet'
            : 'Live data'}
        </div>
      </footer>
    </div>
  );
}

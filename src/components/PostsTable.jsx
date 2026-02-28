import { useState, useMemo } from 'react';
import { getAvgPostEngagementRate, formatNumber } from '../utils/dataHelpers';

const PAGE_SIZE = 10;

const ADAM_COLUMNS = [
  { key: 'Format',           label: 'Format',         sortable: true  },
  { key: 'Impressions',      label: 'Impressions',     sortable: true  },
  { key: 'Engagements',      label: 'Engagements',     sortable: true  },
  { key: 'Engagement_Rate',  label: 'Eng. Rate',       sortable: true  },
  { key: 'Profile_Views',    label: 'Profile Views',   sortable: true  },
  { key: 'Followers_Gained', label: 'Followers Gained', sortable: true },
];

const CHORE_COLUMNS = [
  { key: 'Impressions',     label: 'Impressions', sortable: true },
  { key: 'Engagements',     label: 'Engagements', sortable: true },
  { key: 'Engagement_Rate', label: 'Eng. Rate',   sortable: true },
];

function SortIcon({ direction }) {
  if (!direction) return <span className="ml-1 text-slate-600">↕</span>;
  return <span className="ml-1 text-blue-400">{direction === 'asc' ? '↑' : '↓'}</span>;
}

export default function PostsTable({ posts, account = 'Adam', accentColor = '#3B82F6' }) {
  const COLUMNS = account === 'Adam' ? ADAM_COLUMNS : CHORE_COLUMNS;

  const [sortKey, setSortKey] = useState('Impressions');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const avgRate = useMemo(() => getAvgPostEngagementRate(posts), [posts]);

  const sorted = useMemo(() => {
    return [...posts].sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [posts, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key) {
    if (!COLUMNS.find((c) => c.key === key)?.sortable) return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }

  function engRateColor(rate) {
    if (rate >= avgRate) return 'text-emerald-400 font-semibold';
    return 'text-red-400';
  }

  function renderCell(post, col) {
    const val = post[col.key];
    if (col.key === 'Engagement_Rate') {
      return (
        <td key={col.key} className={`px-4 py-3 whitespace-nowrap tabular-nums ${engRateColor(val ?? 0)}`}>
          {val != null ? `${val}%` : '—'}
        </td>
      );
    }
    if (col.key === 'Format') {
      return (
        <td key={col.key} className="px-4 py-3 whitespace-nowrap text-slate-300">
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium">
            {val ?? '—'}
          </span>
        </td>
      );
    }
    return (
      <td key={col.key} className="px-4 py-3 whitespace-nowrap text-slate-300 tabular-nums">
        {formatNumber(val)}
      </td>
    );
  }

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700 shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-200">
          Post Performance
          <span className="ml-2 text-xs text-slate-500 font-normal">
            (avg. engagement: {avgRate}%)
          </span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap select-none ${
                    col.sortable ? 'cursor-pointer hover:text-slate-200 transition-colors' : ''
                  }`}
                >
                  {col.label}
                  {col.sortable && (
                    <SortIcon direction={sortKey === col.key ? sortDir : null} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60">
            {pageItems.map((post, idx) => (
              <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                {COLUMNS.map((col) => renderCell(post, col))}
              </tr>
            ))}
            {!pageItems.length && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-slate-500">
                  No posts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700">
          <span className="text-xs text-slate-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of{' '}
            {sorted.length} posts
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  p === page ? 'text-white' : 'text-slate-400 hover:bg-slate-700'
                }`}
                style={p === page ? { backgroundColor: accentColor } : {}}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

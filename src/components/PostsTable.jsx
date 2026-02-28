import { useState, useMemo } from 'react';
import { enrichPosts, getAvgPostEngagementRate, formatNumber, formatDate } from '../utils/dataHelpers';

const PAGE_SIZE = 10;

const COLUMNS = [
  { key: 'Date', label: 'Date', sortable: true },
  { key: 'Post_Preview', label: 'Post Preview', sortable: false },
  { key: 'Impressions', label: 'Impressions', sortable: true },
  { key: 'Likes', label: 'Likes', sortable: true },
  { key: 'Comments', label: 'Comments', sortable: true },
  { key: 'Reposts', label: 'Reposts', sortable: true },
  { key: 'Engagement_Rate', label: 'Eng. Rate', sortable: true },
];

function SortIcon({ direction }) {
  if (!direction) return <span className="ml-1 text-slate-600">↕</span>;
  return <span className="ml-1 text-blue-400">{direction === 'asc' ? '↑' : '↓'}</span>;
}

export default function PostsTable({ posts, accentColor = '#3B82F6' }) {
  const [sortKey, setSortKey] = useState('Date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const enriched = useMemo(() => enrichPosts(posts), [posts]);
  const avgRate = useMemo(() => getAvgPostEngagementRate(posts), [posts]);

  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (sortKey === 'Date') {
        va = new Date(va);
        vb = new Date(vb);
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [enriched, sortKey, sortDir]);

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
                <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                  {formatDate(post.Date)}
                </td>
                <td className="px-4 py-3 text-slate-300 max-w-xs">
                  <span className="line-clamp-2 text-sm">
                    {(post.Post_Preview ?? '').slice(0, 60)}
                    {(post.Post_Preview ?? '').length > 60 ? '…' : ''}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-300 tabular-nums">
                  {formatNumber(post.Impressions)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-300 tabular-nums">
                  {formatNumber(post.Likes)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-300 tabular-nums">
                  {formatNumber(post.Comments)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-300 tabular-nums">
                  {formatNumber(post.Reposts)}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap tabular-nums ${engRateColor(post.Engagement_Rate)}`}>
                  {post.Engagement_Rate}%
                </td>
              </tr>
            ))}
            {!pageItems.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No posts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
                  p === page
                    ? 'text-white'
                    : 'text-slate-400 hover:bg-slate-700'
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

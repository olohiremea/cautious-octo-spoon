export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-slate-800 p-12 text-center ring-1 ring-slate-700">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/30">
        <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-100">Failed to load data</h3>
        <p className="mt-1 text-sm text-slate-400 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

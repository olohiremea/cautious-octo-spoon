function SkeletonBox({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-700/60 ${className}`} />
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metric cards row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBox key={i} className="h-28" />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonBox className="h-64" />
        <SkeletonBox className="h-64" />
      </div>

      {/* Table */}
      <SkeletonBox className="h-80" />
    </div>
  );
}

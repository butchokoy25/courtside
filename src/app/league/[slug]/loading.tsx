export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* League header skeleton */}
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="h-5 w-64 bg-muted animate-pulse rounded" />
      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b pb-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded" />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}

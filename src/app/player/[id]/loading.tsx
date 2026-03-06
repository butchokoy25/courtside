export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Player header skeleton */}
      <div className="flex items-center gap-4">
        <div className="size-16 bg-muted animate-pulse rounded-full" />
        <div className="space-y-2">
          <div className="h-7 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-28 bg-muted animate-pulse rounded" />
        </div>
      </div>
      {/* Stats grid skeleton */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      {/* Game log skeleton */}
      <div className="h-6 w-24 bg-muted animate-pulse rounded" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Team header skeleton */}
      <div className="flex items-center gap-4">
        <div className="size-12 bg-muted animate-pulse rounded-full" />
        <div className="space-y-2">
          <div className="h-7 w-44 bg-muted animate-pulse rounded" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </div>
      </div>
      {/* Record skeleton */}
      <div className="grid gap-4 grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      {/* Roster skeleton */}
      <div className="h-6 w-20 bg-muted animate-pulse rounded" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  )
}

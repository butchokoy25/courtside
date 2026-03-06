export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-5 w-72 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

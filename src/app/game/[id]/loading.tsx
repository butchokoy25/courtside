export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Score header skeleton */}
      <div className="flex items-center justify-center gap-8">
        <div className="h-12 w-24 bg-muted animate-pulse rounded" />
        <div className="h-8 w-12 bg-muted animate-pulse rounded" />
        <div className="h-12 w-24 bg-muted animate-pulse rounded" />
      </div>
      {/* Box score skeleton */}
      <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
      <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
    </div>
  )
}

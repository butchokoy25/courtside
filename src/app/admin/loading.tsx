export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="h-8 w-40 bg-muted animate-pulse rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}

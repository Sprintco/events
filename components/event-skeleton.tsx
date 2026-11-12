/** Placeholder shaped like an EventCard while events load. */
export function EventCardSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border bg-card"
      aria-hidden="true">
      <div className="h-40 bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 rounded-full bg-muted" />
        <div className="h-4 w-1/2 rounded-full bg-muted" />
        <div className="h-4 w-2/5 rounded-full bg-muted" />
      </div>
    </div>
  );
}

export function EventGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading events"
      className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

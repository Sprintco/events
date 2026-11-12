import { Suspense } from "react";
import { db, type EventRow } from "@/lib/db";
import { EventCard } from "@/components/event-card";
import { EventGridSkeleton } from "@/components/event-skeleton";

export const metadata = { title: "Events - AdultFriendFinder" };

async function EventList() {
  const sql = await db();
  const events = await sql<EventRow[]>`select * from events order by starts_at`;
  if (events.length === 0)
    return (
      <p className="mt-10 text-muted-foreground">
        No events yet. Check back soon.
      </p>
    );
  return (
    <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
      {events.map((e) => (
        <EventCard key={e.id} e={e} />
      ))}
    </div>
  );
}

export default function EventsPage() {
  return (
    <main className="px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold">Events</h1>
      <p className="mt-2 text-muted-foreground">
        Pick an event to see the details and register.
      </p>
      <Suspense fallback={<div className="mt-8"><EventGridSkeleton count={6} /></div>}>
        <EventList />
      </Suspense>
    </main>
  );
}

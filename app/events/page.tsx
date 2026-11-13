import { Suspense } from "react";
import Link from "next/link";
import { db, type EventRow } from "@/lib/db";
import { PageHero } from "@/components/page-hero";
import { ReserveButton } from "@/components/reserve-button";
import { EventCard } from "@/components/event-card";
import { EventGridSkeleton } from "@/components/event-skeleton";

export const metadata = { title: "Events - AdultFriendFinder" };

const FILTERS: Record<string, { eyebrow: string; title: string; sub: string }> = {
  all: { eyebrow: "What's on", title: "Events", sub: "Pick an event to see the details and reserve." },
  private: { eyebrow: "Invite only", title: "Private events", sub: "Exclusive gatherings, by invitation." },
  free: { eyebrow: "On the house", title: "Free events", sub: "No ticket needed. Just reserve your spot." },
  trending: { eyebrow: "Right now", title: "Trending", sub: "The events people are looking at this week." },
  week: { eyebrow: "Plan ahead", title: "This week", sub: "Everything happening in the next seven days." },
  near: { eyebrow: "Around the city", title: "Near you", sub: "Browse events by venue and location." },
  new: { eyebrow: "Just added", title: "New events", sub: "The latest additions from the host." },
};

async function query(filter: string, loc: string): Promise<(EventRow & { views?: number })[]> {
  const sql = await db();
  switch (filter) {
    case "private":
      return sql`select * from events where is_private order by starts_at`;
    case "free":
      return sql`select * from events where price_usd = 0 order by starts_at`;
    case "trending":
      return sql`select e.*, count(v.id)::int as views from events e
        left join event_views v on v.event_id = e.id and v.created_at > now() - interval '7 days'
        where e.starts_at >= now() - interval '1 day'
        group by e.id order by views desc, e.starts_at limit 12`;
    case "week":
      return sql`select * from events where starts_at >= now() - interval '1 day'
        and starts_at < now() + interval '7 days' order by starts_at`;
    case "new":
      return sql`select * from events order by id desc limit 12`;
    case "near":
      return loc
        ? sql`select * from events where location = ${loc} order by starts_at`
        : sql`select * from events order by location, starts_at`;
    default:
      return sql`select * from events order by starts_at`;
  }
}

async function Results({ searchParams }: { searchParams: Promise<{ filter?: string; loc?: string }> }) {
  const sp = await searchParams;
  const filter = sp.filter && FILTERS[sp.filter] ? sp.filter : "all";
  const loc = sp.loc ?? "";
  const meta = FILTERS[filter];
  const events = await query(filter, loc);
  const locations =
    filter === "near" ? [...new Set(events.map((e) => e.location).filter(Boolean))] : [];
  return (
    <>
      <PageHero eyebrow={meta.eyebrow} title={meta.title} sub={meta.sub}>
        <ReserveButton />
      </PageHero>
      <section className="px-4 pb-16 pt-8 sm:px-6">
        {filter === "near" && locations.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/events?filter=near"
              className={`rounded-full border px-4 py-1.5 text-sm ${!loc ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
              All venues
            </Link>
            {locations.map((l) => (
              <Link
                key={l}
                href={`/events?filter=near&loc=${encodeURIComponent(l)}`}
                className={`rounded-full border px-4 py-1.5 text-sm ${loc === l ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                {l}
              </Link>
            ))}
          </div>
        )}
        {events.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">Nothing here yet. Check back soon.</p>
        ) : (
          <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
            {events.map((e) => (
              <EventCard
                key={e.id}
                e={e}
                badge={filter === "trending" && e.views ? `${e.views} views this week` : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; loc?: string }>;
}) {
  return (
    <main>
      <Suspense
        fallback={
          <>
            <PageHero eyebrow={FILTERS.all.eyebrow} title="Events" sub={FILTERS.all.sub} />
            <div className="px-4 pt-8 sm:px-6"><EventGridSkeleton count={6} /></div>
          </>
        }>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

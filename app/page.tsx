import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flame } from "lucide-react";
import { db, type EventRow } from "@/lib/db";
import { EventCard } from "@/components/event-card";
import { EventGridSkeleton } from "@/components/event-skeleton";

const empty = <p className="text-muted-foreground">No events yet. Check back soon.</p>;
const grid = "grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6";

/** Hero photos: the covers of the newest events, shown faded on the right. */
async function HeroPhotos() {
  const sql = await db();
  const rows = await sql<{ cover_url: string }[]>`
    select cover_url from events where cover_url is not null order by id desc limit 3`;
  if (rows.length === 0) return null;
  return (
    <div
      aria-hidden="true"
      className="absolute inset-y-0 right-0 hidden w-3/5 grid-cols-3 gap-3 p-6 opacity-70 md:grid [mask-image:linear-gradient(to_right,transparent,black_45%)]">
      {rows.map((r, i) => (
        <div
          key={r.cover_url}
          className={`relative overflow-hidden rounded-3xl ${i === 1 ? "-mt-6 mb-6" : i === 2 ? "mt-8 -mb-8" : ""}`}>
          <Image src={r.cover_url} alt="" fill unoptimized sizes="20vw" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

async function TrendingEvents() {
  const sql = await db();
  const events = await sql<(EventRow & { regs: number })[]>`
    select e.*, count(r.id)::int as regs
    from events e left join registrations r on r.event_id = e.id
    where e.starts_at >= now() - interval '1 day'
    group by e.id
    order by regs desc, e.starts_at
    limit 3`;
  if (events.length === 0) return empty;
  return (
    <div className={grid}>
      {events.map((e) => (
        <EventCard
          key={e.id}
          e={e}
          badge={e.regs > 0 ? `${e.regs} registered` : "Trending"}
        />
      ))}
    </div>
  );
}

async function UpcomingEvents() {
  const sql = await db();
  const events = await sql<EventRow[]>`
    select * from events where starts_at >= now() - interval '1 day' order by starts_at limit 3`;
  if (events.length === 0) return empty;
  return (
    <div className={grid}>
      {events.map((e) => <EventCard key={e.id} e={e} />)}
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-ink text-white">
        {/* Colour glows, always visible even with no event photos */}
        <div className="absolute -left-24 -top-24 -z-10 size-96 rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 -z-10 size-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
        <Suspense fallback={null}>
          <HeroPhotos />
        </Suspense>
        <div className="relative px-4 py-20 sm:px-6 md:py-28">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
            Exclusive events
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">
            Find your next <span className="text-accent">unforgettable</span> experience.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/70">
            Browse upcoming events, see the details and price, and register in seconds.
          </p>
          <Link
            href="/events"
            className="mt-8 inline-block rounded-full bg-primary px-6 py-3 font-semibold hover:opacity-90"
          >
            Browse events
          </Link>
        </div>
      </section>

      <section className="px-4 pt-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Flame className="size-6 text-primary" /> Trending now
          </h2>
          <Link href="/events" className="text-sm font-medium text-primary">View all →</Link>
        </div>
        <Suspense fallback={<EventGridSkeleton />}>
          <TrendingEvents />
        </Suspense>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Upcoming events</h2>
          <Link href="/events" className="text-sm font-medium text-primary">View all →</Link>
        </div>
        <Suspense fallback={<EventGridSkeleton />}>
          <UpcomingEvents />
        </Suspense>
      </section>
    </main>
  );
}

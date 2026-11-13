import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { db, type EventRow } from "@/lib/db";
import { EventCard } from "@/components/event-card";
import { EventGridSkeleton } from "@/components/event-skeleton";
import { ReserveButton } from "@/components/reserve-button";
import { SectionHead } from "@/components/page-hero";

const empty = (
  <p className="text-muted-foreground">No events yet. Check back soon.</p>
);
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
          <Image
            src={r.cover_url}
            alt=""
            fill
            unoptimized
            sizes="20vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

async function Gallery() {
  const sql = await db();
  const rows = await sql<{ cover_url: string }[]>`
    select cover_url from events where cover_url is not null order by id desc limit 8`;
  if (rows.length === 0) return null;
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4">
      {rows.map((r, i) => (
        <div
          key={r.cover_url}
          className={`relative overflow-hidden rounded-2xl ${i % 5 === 0 ? "aspect-[3/4] md:row-span-2 md:aspect-auto" : "aspect-square"}`}>
          <Image
            src={r.cover_url}
            alt=""
            fill
            unoptimized
            sizes="25vw"
            className="object-cover transition duration-700 hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}

async function TrendingEvents() {
  const sql = await db();
  const events = await sql<(EventRow & { views: number })[]>`
    select e.*, count(v.id)::int as views
    from events e left join event_views v
      on v.event_id = e.id and v.created_at > now() - interval '7 days'
    where e.starts_at >= now() - interval '1 day'
    group by e.id
    order by views desc, e.starts_at
    limit 3`;
  if (events.length === 0) return empty;
  return (
    <div className={grid}>
      {events.map((e) => (
        <EventCard
          key={e.id}
          e={e}
          badge={e.views > 0 ? `${e.views} views this week` : "Trending"}
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
      {events.map((e) => (
        <EventCard key={e.id} e={e} />
      ))}
    </div>
  );
}

const HOURS = [
  ["Monday to Tuesday", "Open"],
  ["Wednesday to Thursday", "5 PM to 1 AM"],
  ["Friday to Saturday", "5 PM to 2 AM"],
  ["Sunday", "11 AM to 9 PM"],
];

const PROGRAMMING = [
  ["Wed to Sat", "Live performers"],
  ["10 PM", "DJ takes over"],
  ["Until close", "Late-night menu"],
];

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
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-bold tracking-tight md:text-6xl">
            Find your next <span className="text-accent">unforgettable</span>{" "}
            experience.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/70">
            Browse upcoming events, see the details and price, and reserve your
            table in seconds.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {[
              "Live music",
              "Craft cocktails",
              "Private dining",
              "Bottle service",
            ].map((t) => (
              <li
                key={t}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/80">
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/events"
              className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90">
              Browse events
            </Link>
            <ReserveButton variant="outline" />
          </div>
        </div>
      </section>

      <section className="px-4 pt-16 sm:px-6">
        <SectionHead
          eyebrow="Right now"
          title="Trending now"
          sub="The events people are looking at this week."
        />
        <Suspense fallback={<EventGridSkeleton />}>
          <TrendingEvents />
        </Suspense>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <SectionHead eyebrow="Save the date" title="Upcoming events" />
        <Suspense fallback={<EventGridSkeleton />}>
          <UpcomingEvents />
        </Suspense>
        <div className="mt-10 text-center">
          <Link
            href="/events"
            className="text-sm font-semibold uppercase tracking-wider text-primary">
            View all events →
          </Link>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <SectionHead
          eyebrow="The experience"
          title="A night worth dressing up for"
        />
        <Suspense
          fallback={
            <div className="mx-auto h-64 max-w-6xl animate-pulse rounded-2xl bg-muted" />
          }>
          <Gallery />
        </Suspense>
      </section>

      <section className="bg-secondary/50 px-4 py-16 sm:px-6">
        <SectionHead eyebrow="When to visit" title="Open late, every week" />
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl border bg-card p-8">
            <h3 className="font-display text-2xl font-bold">Hours</h3>
            <dl className="mt-5 space-y-3 text-sm">
              {HOURS.map(([d, h]) => (
                <div
                  key={d}
                  className="flex justify-between gap-4 border-b border-dashed pb-3 last:border-0">
                  <dt className="text-muted-foreground">{d}</dt>
                  <dd className="font-semibold">{h}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-3xl bg-primary p-8 text-primary-foreground">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-80">
              Weekdays
            </p>
            <h3 className="mt-2 font-display text-3xl font-bold">Fancy Hour</h3>
            <p className="mt-3 opacity-90">
              Discounted cocktails and bar bites, 5 PM to 7 PM, Wednesday
              through Friday.
            </p>
            <ReserveButton
              className="mt-6 !bg-white !text-[#1e120f]"
              label="Reserve a table"
            />
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-ink px-4 py-20 text-white sm:px-6">
        <div className="absolute right-0 top-0 -z-10 size-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Programming
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            Live music and DJs, building all night
          </h2>
        </div>
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {PROGRAMMING.map(([a, b]) => (
            <div
              key={a}
              className="rounded-2xl border border-white/15 p-6 text-center">
              <p className="font-display text-2xl font-bold text-accent">{a}</p>
              <p className="mt-1 text-sm text-white/70">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-20 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Your table awaits
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-bold md:text-5xl">
          Reserve tonight, or host your own private event
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ReserveButton />
          <Link
            href="/private-events"
            className="inline-block rounded-full border border-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary hover:bg-primary/10">
            Private events
          </Link>
          <Link
            href="/menu"
            className="inline-block rounded-full border px-6 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-secondary">
            View menu
          </Link>
        </div>
      </section>
    </main>
  );
}

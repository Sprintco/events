import { Suspense } from "react";
import Image from "next/image";
import {
  Wine,
  GlassWater,
  Music,
  MonitorSpeaker,
  Crown,
  Sparkles,
  Users,
  Building2,
} from "lucide-react";
import { db, type EventRow } from "@/lib/db";
import { EventCard } from "@/components/event-card";
import { EventGridSkeleton } from "@/components/event-skeleton";
import { PageHero, SectionHead } from "@/components/page-hero";
import { ReserveButton } from "@/components/reserve-button";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Private events", description: "Invitation-only parties and private lounge nights. Reserve a table or a spot for your group.", path: "/private-events" });

const SETTINGS = [
  {
    icon: Building2,
    guests: "Up to 80 guests",
    title: "Full venue buyout",
    desc: "The whole lounge is yours: every room, the full bar and our team, for a celebration that is entirely your own.",
  },
  {
    icon: Users,
    guests: "20 to 35 guests",
    title: "Semi-private bay",
    desc: "A dedicated section with its own host and bar service, close to the energy of the room but set apart from it.",
  },
];

const SERVICES = [
  { icon: Wine, title: "Curated menus", desc: "Chef-designed menus for every occasion and dietary need." },
  { icon: GlassWater, title: "Bottle service", desc: "Pre-selected bottles, ready when your guests arrive." },
  { icon: Music, title: "Entertainment", desc: "DJs, live bands and performers to set the tone." },
  { icon: MonitorSpeaker, title: "A/V production", desc: "Sound, lighting and screens handled by our team." },
  { icon: Crown, title: "VIP coordination", desc: "A dedicated host looks after your guest list and arrivals." },
  { icon: Sparkles, title: "Custom touches", desc: "Florals, signage, cakes and the details that make it yours." },
];

async function Photos() {
  const sql = await db();
  const rows = await sql<{ cover_url: string }[]>`
    select cover_url from events where cover_url is not null order by id desc limit 5`;
  if (rows.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {rows.map((r) => (
        <div key={r.cover_url} className="relative aspect-[3/4] overflow-hidden rounded-2xl">
          <Image src={r.cover_url} alt="" fill unoptimized sizes="20vw" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

async function PrivateEventList() {
  const sql = await db();
  const events = await sql<EventRow[]>`
    select * from events where is_private and starts_at >= now() - interval '1 day' order by starts_at limit 6`;
  if (events.length === 0) return <p className="text-center text-muted-foreground">No private events listed right now.</p>;
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
      {events.map((e) => (
        <EventCard key={e.id} e={e} />
      ))}
    </div>
  );
}

export default function PrivateEventsPage() {
  return (
    <main>
      <PageHero
        eyebrow="Host with us"
        title="Private events"
        sub="Birthdays, launches, dinners and everything in between, hosted in a room built for it.">
        <ReserveButton label="Inquire today" />
      </PageHero>

      <section className="px-4 py-16 sm:px-6">
        <SectionHead eyebrow="Tailored experiences" title="Choose your setting" />
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {SETTINGS.map((s) => (
            <div key={s.title} className="rounded-3xl border bg-card p-8">
              <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <s.icon className="size-6" />
              </span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{s.guests}</p>
              <h3 className="mt-2 font-display text-2xl font-bold">{s.title}</h3>
              <p className="mt-3 text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <SectionHead eyebrow="Culinary excellence" title="Catering for every occasion" />
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" />}>
          <Photos />
        </Suspense>
      </section>

      <section className="bg-secondary/50 px-4 py-16 sm:px-6">
        <SectionHead eyebrow="What we offer" title="Event services" />
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-2xl border bg-card p-6">
              <s.icon className="size-6 text-primary" />
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <SectionHead
          eyebrow="Groups of 8+"
          title="Large party reservations"
          sub="Pre-set menus, tab options, pre-authorized bottles and celebration add-ons, arranged ahead so the night runs smoothly."
        />
        <Suspense fallback={<EventGridSkeleton />}>
          <PrivateEventList />
        </Suspense>
      </section>

      <section className="relative isolate overflow-hidden bg-ink px-4 py-20 text-center text-white sm:px-6">
        <div className="absolute left-1/2 top-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Let&apos;s plan</p>
        <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-bold md:text-5xl">
          Start the conversation
        </h2>
        <p className="mx-auto mt-4 max-w-md text-white/70">
          Tell us about your event and we will reply within one business day.
        </p>
        <div className="mt-8">
          <ReserveButton />
        </div>
      </section>
    </main>
  );
}

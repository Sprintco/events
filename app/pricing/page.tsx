import { Suspense } from "react";
import Link from "next/link";
import { db, formatPrice, type EventRow } from "@/lib/db";
import { PageHero } from "@/components/page-hero";
import { ReserveButton } from "@/components/reserve-button";

export const metadata = { title: "Pricing - AdultFriendFinder" };

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

async function Table() {
  const sql = await db();
  const events = await sql<EventRow[]>`
    select * from events where starts_at >= now() - interval '1 day' order by price_usd, starts_at`;
  if (events.length === 0) return <p className="text-center text-muted-foreground">No events yet.</p>;
  const prices = events.map((e) => Number(e.price_usd));
  const paid = prices.filter((p) => p > 0);
  return (
    <>
      <div className="mx-auto mb-10 grid max-w-3xl gap-4 sm:grid-cols-3">
        {[
          ["Free events", String(prices.filter((p) => p === 0).length)],
          ["Lowest paid", paid.length ? formatPrice(Math.min(...paid)) : "-"],
          ["Highest", formatPrice(Math.max(...prices))],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border bg-card p-5 text-center">
            <p className="font-display text-3xl font-bold text-primary">{v}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>
      <ul className="mx-auto max-w-3xl divide-y rounded-3xl border bg-card">
        {events.map((e) => (
          <li key={e.id}>
            <Link href={`/events/${e.slug}`} className="flex items-baseline gap-3 p-5 hover:bg-secondary/60">
              <span className="font-semibold">{e.title}</span>
              <span className="text-xs text-muted-foreground">{dateFmt.format(new Date(e.starts_at))}</span>
              <span className="mb-1 flex-1 self-end border-b border-dotted border-muted-foreground/40" />
              <span className="font-display text-lg font-bold text-primary">{formatPrice(e.price_usd)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Prices are in USD. Reserve through the chat; payment is arranged with the host.
      </p>
    </>
  );
}

export default function PricingPage() {
  return (
    <main>
      <PageHero eyebrow="Know before you go" title="Pricing" sub="What every upcoming event costs, lowest first.">
        <ReserveButton />
      </PageHero>
      <section className="px-4 py-12 sm:px-6">
        <Suspense fallback={<div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-muted" />}>
          <Table />
        </Suspense>
      </section>
    </main>
  );
}

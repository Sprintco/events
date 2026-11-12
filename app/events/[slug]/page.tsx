import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Lock, ArrowLeft } from "lucide-react";
import { db, type EventRow, formatDate, formatPrice } from "@/lib/db";
import { RegisterForm } from "./register-form";

async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sql = await db();
  const [e] = await sql<EventRow[]>`select * from events where slug = ${slug}`;
  if (!e) notFound();

  return (
    <>
      <Link href="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All events
      </Link>

      {e.cover_url && (
        <div className="relative mt-6 aspect-[16/7] overflow-hidden rounded-2xl bg-secondary">
          <Image src={e.cover_url} alt={e.title} fill unoptimized priority sizes="100vw" className="object-cover" />
        </div>
      )}

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_340px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
              {formatPrice(e.price_usd)}
            </span>
            {e.is_private && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                <Lock className="size-3" /> Private event
              </span>
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{e.title}</h1>
          <div className="mt-4 space-y-2 text-muted-foreground">
            <p className="flex items-center gap-2"><CalendarDays className="size-4" /> {formatDate(e.starts_at)}</p>
            {e.location && <p className="flex items-center gap-2"><MapPin className="size-4" /> {e.location}</p>}
          </div>
          <h2 className="mt-8 text-lg font-semibold">About this event</h2>
          <p className="mt-2 whitespace-pre-line leading-7">{e.description || "Details coming soon."}</p>
        </div>

        <aside className="h-fit rounded-2xl border bg-card p-6 md:sticky md:top-24">
          <p className="text-sm text-muted-foreground">Price</p>
          <p className="text-3xl font-bold">{formatPrice(e.price_usd)}</p>
          <RegisterForm eventId={e.id} slug={e.slug} price={Number(e.price_usd)} />
        </aside>
      </div>
    </>
  );
}

export default function EventPage({ params }: PageProps<"/events/[slug]">) {
  return (
    <main className="px-4 sm:px-6 py-10">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <EventDetail params={params} />
      </Suspense>
    </main>
  );
}

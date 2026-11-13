import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CalendarDays, Eye, Lock, MessageCircle, Plus, Users } from "lucide-react";
import { currentAdmin } from "@/lib/auth";
import { db, type EventRow, formatPrice } from "@/lib/db";
import { logout } from "./actions";
import { EventForm } from "./event-form";
import { ConfirmDelete } from "./confirm-delete";

const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });

function ago(iso: string | Date) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

const cutoffMs = () => Date.now() - 24 * 3600 * 1000;

/** Last 7 days of views, including days with none. */
function lastSevenDays(perDay: { d: string; n: number }[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, label: weekday.format(d), n: perDay.find((p) => p.d === key)?.n ?? 0 };
  });
}

function Stat({ icon: Icon, label, value, hint, href, tone }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; hint?: string; href?: string; tone?: "alert";
}) {
  const body = (
    <div className={`h-full rounded-2xl border bg-card p-4 transition ${href ? "hover:border-primary/40" : ""} ${tone === "alert" ? "border-accent" : ""}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-4" /> {label}
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function EventRowItem({ e, views }: { e: EventRow; views: number }) {
  return (
    <li className="flex items-center gap-3 p-3 sm:p-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
        {e.cover_url && <Image src={e.cover_url} alt="" fill unoptimized sizes="64px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/events/${e.slug}`} className="block truncate font-semibold hover:text-primary">{e.title}</Link>
        <p className="truncate text-xs text-muted-foreground">
          {dayFmt.format(new Date(e.starts_at))} · {e.location || "No location"}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="rounded-full bg-accent px-2 py-0.5 font-bold text-accent-foreground">{formatPrice(e.price_usd)}</span>
          {e.is_private && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium"><Lock className="size-3" /> Private</span>
          )}
          <span className="inline-flex items-center gap-1 text-muted-foreground"><Eye className="size-3" /> {views} this week</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        <Link href={`/admin/events/${e.id}`} className="rounded-full border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
          Edit
        </Link>
        <ConfirmDelete id={e.id} title={e.title} />
      </div>
    </li>
  );
}

async function Dashboard() {
  const me = await currentAdmin();
  if (!me) redirect("/admin/login");
  if (me.must_change) redirect("/admin/account");
  const sql = await db();

  const [events, viewRows, perDay, chat, recentChats, online] = await Promise.all([
    sql<EventRow[]>`select * from events order by starts_at`,
    sql<{ event_id: number; n: number }[]>`
      select event_id, count(*)::int as n from event_views
      where created_at > now() - interval '7 days' group by event_id`,
    sql<{ d: string; n: number }[]>`
      select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as d, count(*)::int as n
      from event_views where created_at > now() - interval '7 days' group by 1 order by 1`,
    sql<{ waiting: number; open: number }[]>`
      select
        count(*) filter (where (select sender from chat_messages m where m.conversation_id = c.id order by id desc limit 1) = 'visitor')::int as waiting,
        count(*)::int as open
      from chat_conversations c where c.closed_at is null`,
    sql<{ id: string; name: string; body: string | null; sender: string | null; at: string | null }[]>`
      select c.id, c.name, m.body, m.sender, m.created_at as at
      from chat_conversations c
      left join lateral (select body, sender, created_at from chat_messages where conversation_id = c.id order by id desc limit 1) m on true
      where c.closed_at is null and m.body is not null order by m.created_at desc limit 5`,
    sql<{ n: number }[]>`select count(*)::int as n from visitors where last_seen > now() - interval '45 seconds'`,
  ]);

  const views = new Map(viewRows.map((v) => [v.event_id, v.n]));
  const totalViews = viewRows.reduce((a, v) => a + v.n, 0);
  const cutoff = cutoffMs();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= cutoff);
  const past = events.filter((e) => new Date(e.starts_at).getTime() < cutoff).reverse();
  const top = events
    .map((e) => ({ e, n: views.get(e.id) ?? 0 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  const days = lastSevenDays(perDay);
  const peak = Math.max(1, ...days.map((d) => d.n));
  const waiting = chat[0]?.waiting ?? 0;

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your events, visitors and support chat at a glance.</p>
        </div>
        <Link href="/" className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-secondary">View site</Link>
        {me.role === "super" && (
          <Link href="/admin/team" className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-secondary">Team</Link>
        )}
        <Link href="/admin/account" className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-secondary">Account</Link>
        <Link href="/admin/chat" className="relative rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
          Support inbox
          {waiting > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">{waiting}</span>
          )}
        </Link>
        <form action={logout}>
          <button className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-secondary">Sign out</button>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={CalendarDays} label="Upcoming" value={upcoming.length} hint={`${events.length} events in total`} />
        <Stat icon={Eye} label="Views, 7 days" value={totalViews.toLocaleString("en-US")} hint="Event page visits" />
        <Stat icon={MessageCircle} label="Waiting" value={waiting} hint={`${chat[0]?.open ?? 0} open chats`} href="/admin/chat" tone={waiting ? "alert" : undefined} />
        <Stat icon={Users} label="Online now" value={online[0]?.n ?? 0} hint="Visitors on the site" href="/admin/chat" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Chats</h2>
              <Link href="/admin/chat" className="text-xs font-semibold text-primary hover:underline">Open inbox</Link>
            </div>
            {recentChats.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No open conversations.</p>
            ) : (
              <ul className="mt-2 divide-y">
                {recentChats.map((c) => (
                  <li key={c.id}>
                    <Link href="/admin/chat" className="flex items-center gap-3 py-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {c.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">{c.name}</span>
                          {c.at && <span className="shrink-0 text-[11px] text-muted-foreground">{ago(c.at)}</span>}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="truncate text-xs text-muted-foreground">{c.sender === "admin" ? "You: " : ""}{c.body}</span>
                          {c.sender === "visitor" && <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">Reply</span>}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-4">
            <h2 className="font-semibold">Views this week</h2>
            <div className="mt-4 flex h-24 items-end gap-2" role="img" aria-label="Event page views per day for the last 7 days">
              {days.map((d) => (
                <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{d.n || ""}</span>
                  <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${Math.max(4, (d.n / peak) * 64)}px`, opacity: d.n ? 1 : 0.25 }} />
                  <span className="text-[10px] text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
            {top.length > 0 && (
              <>
                <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Most viewed</h3>
                <ol className="mt-2 space-y-2 text-sm">
                  {top.map(({ e, n }, i) => (
                    <li key={e.id} className="flex items-center gap-2">
                      <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
                      <Link href={`/admin/events/${e.id}`} className="min-w-0 flex-1 truncate hover:text-primary">{e.title}</Link>
                      <span className="shrink-0 text-xs font-semibold">{n}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <details className="group rounded-2xl border bg-card">
            <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-semibold [&::-webkit-details-marker]:hidden">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="size-4 transition group-open:rotate-45" /></span>
              New event
              <span className="ml-auto text-xs font-normal text-muted-foreground group-open:hidden">Tap to open the form</span>
            </summary>
            <div className="border-t p-4"><EventForm /></div>
          </details>

          <section>
            <h2 className="mb-3 font-semibold">Upcoming events ({upcoming.length})</h2>
            {upcoming.length === 0 ? (
              <p className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">No upcoming events. Create one above.</p>
            ) : (
              <ul className="divide-y rounded-2xl border bg-card">
                {upcoming.map((e) => <EventRowItem key={e.id} e={e} views={views.get(e.id) ?? 0} />)}
              </ul>
            )}
          </section>

          {past.length > 0 && (
            <details className="rounded-2xl border bg-card">
              <summary className="cursor-pointer p-4 font-semibold">Past events ({past.length})</summary>
              <ul className="divide-y border-t">
                {past.map((e) => <EventRowItem key={e.id} e={e} views={views.get(e.id) ?? 0} />)}
              </ul>
            </details>
          )}
        </div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-muted-foreground sm:px-6">Loading…</p>}>
      <Dashboard />
    </Suspense>
  );
}

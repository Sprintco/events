import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { db, type EventRow, formatDate, formatPrice } from "@/lib/db";
import { deleteEvent, logout, togglePaid } from "./actions";
import { EventForm } from "./event-form";

type Reg = { id: number; event_id: number; name: string; email: string; paid: boolean };

async function Dashboard() {
  if (!(await isAdmin())) redirect("/admin/login");

  const sql = await db();
  const events = await sql<EventRow[]>`select * from events order by starts_at desc`;
  const regs = await sql<Reg[]>`select id, event_id, name, email, paid from registrations order by created_at`;

  return (
    <main className="px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-3xl font-bold">Dashboard</h1>
        <Link href="/admin/chat" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
          Support inbox
        </Link>
        <form action={logout}>
          <button className="rounded-full border px-4 py-2 text-sm font-medium">Sign out</button>
        </form>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <EventForm />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Your events ({events.length})</h2>
          {events.length === 0 && <p className="text-muted-foreground">No events yet.</p>}
          {events.map((e) => {
            const list = regs.filter((r) => r.event_id === e.id);
            return (
              <div key={e.id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="mr-auto">
                    <Link href={`/events/${e.slug}`} className="font-semibold hover:text-primary">{e.title}</Link>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(e.starts_at)} · {formatPrice(e.price_usd)} · {e.is_private ? "Private" : "Public"}
                    </p>
                  </div>
                  <Link href={`/admin/events/${e.id}`} className="text-sm font-semibold text-primary hover:underline">
                    Edit
                  </Link>
                  <form action={deleteEvent}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="text-sm text-destructive hover:underline">Delete</button>
                  </form>
                </div>
                <div className="mt-4 border-t pt-3">
                  <p className="text-sm font-medium">Registrations ({list.length})</p>
                  {list.map((r) => (
                    <div key={r.id} className="mt-2 flex items-center gap-3 text-sm">
                      <span className="mr-auto">{r.name} · <span className="text-muted-foreground">{r.email}</span></span>
                      <form action={togglePaid}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            r.paid ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                          }`}
                        >
                          {r.paid ? "Paid" : "Payment pending"}
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="px-4 sm:px-6 py-10 text-muted-foreground">Loading…</p>}>
      <Dashboard />
    </Suspense>
  );
}

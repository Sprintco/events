import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { db, type EventRow } from "@/lib/db";
import { EventForm } from "../../event-form";

const pad = (n: number) => String(n).padStart(2, "0");

// Value for <input type="datetime-local">, in the same time zone the create form is parsed in.
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function EditGate({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();

  const sql = await db();
  const [e] = await sql<EventRow[]>`select * from events where id = ${eventId}`;
  if (!e) notFound();

  return (
    <>
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
      <h1 className="mb-6 mt-2 text-3xl font-bold">Edit event</h1>
      <EventForm
        event={{
          id: e.id,
          title: e.title,
          description: e.description,
          location: e.location,
          startsAt: toLocalInput(new Date(e.starts_at)),
          price: Number(e.price_usd),
          isPrivate: e.is_private,
          coverUrl: e.cover_url,
        }}
      />
    </>
  );
}

export default function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <EditGate params={params} />
      </Suspense>
    </main>
  );
}

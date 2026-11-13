import { db } from "@/lib/db";

/** Records one page view of an event; the trending lists rank by views in the last 7 days. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { eventId?: unknown } | null;
  const id = Number(body?.eventId);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ ok: false }, { status: 400 });
  const sql = await db();
  await sql`insert into event_views (event_id) select id from events where id = ${id}`;
  return Response.json({ ok: true });
}

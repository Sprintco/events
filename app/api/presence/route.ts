import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Visitor heartbeat: "I'm on the site right now, on this page."
export async function POST(req: Request) {
  const { vid, path, chat } = await req.json().catch(() => ({}));
  if (!UUID.test(String(vid))) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  // The admin browsing the public site is not a visitor.
  if (await isAdmin()) return NextResponse.json({ ok: true });

  const page = String(path ?? "/").slice(0, 200);
  const conv = UUID.test(String(chat)) ? String(chat) : null;
  const sql = await db();
  // A visitor who comes back after 5+ quiet minutes counts as a new arrival.
  await sql`
    insert into visitors (id, path, conversation_id) values (${vid}, ${page}, ${conv})
    on conflict (id) do update set
      path = excluded.path,
      conversation_id = excluded.conversation_id,
      arrived_at = case when visitors.last_seen < now() - interval '5 minutes' then now() else visitors.arrived_at end,
      last_seen = now()`;
  if (Math.random() < 0.02) await sql`delete from visitors where last_seen < now() - interval '2 days'`;
  return NextResponse.json({ ok: true });
}

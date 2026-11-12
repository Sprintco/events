import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Visitor: fetch messages of own conversation
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const id = params.get("id") ?? "";
  if (!UUID.test(id)) return NextResponse.json({ messages: [] });
  const sql = await db();
  // The visitor is looking at the open chat window: support's messages count as seen.
  if (params.get("open") === "1") {
    await sql`update chat_messages set read_at = now()
      where conversation_id = ${id} and sender = 'admin' and read_at is null`;
  }
  const messages = await sql`
    select id, sender, body, created_at from chat_messages where conversation_id = ${id} order by id`;
  const [t] = await sql<{ typing: boolean; closed: boolean }[]>`
    select coalesce(admin_typing_at > now() - interval '4 seconds', false) as typing,
           closed_at is not null as closed
    from chat_conversations where id = ${id}`;
  return NextResponse.json({ messages, adminTyping: !!t?.typing, closed: !!t?.closed });
}

// Visitor: send a message (creates the conversation on first message)
export async function POST(req: Request) {
  const { id, name, email, phone, body } = await req.json().catch(() => ({}));
  const text = String(body ?? "").trim().slice(0, 1000);
  if (!UUID.test(String(id)) || !text) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const sql = await db();
  const cleanName = String(name ?? "").trim().slice(0, 80) || "Visitor";
  const cleanEmail = String(email ?? "").trim().toLowerCase().slice(0, 200);

  const cleanPhone = String(phone ?? "").trim().replace(/[^0-9+()\-\s.]/g, "").slice(0, 30);
  const phoneDigits = cleanPhone.replace(/\D/g, "").length;

  const [existing] = await sql<{ id: string }[]>`select id from chat_conversations where id = ${id}`;
  if (!existing) {
    // A new conversation needs a valid email so support can follow up if the visitor goes offline.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (phoneDigits < 7 || phoneDigits > 15) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }
    await sql`insert into chat_conversations (id, name, email, phone) values (${id}, ${cleanName}, ${cleanEmail}, ${cleanPhone}) on conflict (id) do nothing`;
  }

  const [conv] = await sql<{ closed: boolean }[]>`select closed_at is not null as closed from chat_conversations where id = ${id}`;
  if (conv?.closed) return NextResponse.json({ error: "closed" }, { status: 409 });

  // basic flood guard: max 20 visitor messages per minute per conversation
  const [{ count }] = await sql<{ count: number }[]>`
    select count(*)::int as count from chat_messages
    where conversation_id = ${id} and sender = 'visitor' and created_at > now() - interval '1 minute'`;
  if (count >= 20) return NextResponse.json({ error: "Slow down" }, { status: 429 });

  await sql`insert into chat_messages (conversation_id, sender, body) values (${id}, 'visitor', ${text})`;
  await sql`update chat_conversations set visitor_typing_at = null where id = ${id}`;
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/*
 * Who sees which chat:
 *  - A chat nobody has answered yet (assigned_admin_id is null) is in the shared queue: every admin sees it.
 *  - The first admin to reply owns it. From then on only that admin sees it (and can reply).
 *  - Nobody else can see it, super admins included.
 */

// Admin: list conversations, or messages of one conversation (?id=)
export async function GET(req: Request) {
  const me = await currentAdmin();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = await db();
  const id = new URL(req.url).searchParams.get("id");

  if (id) {
    if (!UUID.test(id)) return NextResponse.json({ messages: [] });
    const [c] = await sql<{ assigned_admin_id: number | null }[]>`
      select assigned_admin_id from chat_conversations where id = ${id}`;
    if (!c || (c.assigned_admin_id !== null && c.assigned_admin_id !== me.id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const messages = await sql`
      select id, sender, body, created_at, read_at from chat_messages where conversation_id = ${id} order by id`;
    const [t] = await sql<{ typing: boolean }[]>`
      select coalesce(visitor_typing_at > now() - interval '4 seconds', false) as typing
      from chat_conversations where id = ${id}`;
    const [p] = await sql<{ online: boolean; last_seen: string }[]>`
      select last_seen > now() - interval '45 seconds' as online, last_seen
      from visitors where conversation_id = ${id} order by last_seen desc limit 1`;
    return NextResponse.json({
      messages,
      visitorTyping: !!t?.typing,
      online: !!p?.online,
      lastSeen: p?.last_seen ?? null,
    });
  }

  const conversations = await sql`
    select c.id, c.name, c.email, c.phone, c.closed_at,
      c.assigned_admin_id, a.name as assigned_name,
      (c.assigned_admin_id = ${me.id}) as mine,
      exists (select 1 from visitors v where v.conversation_id = c.id and v.last_seen > now() - interval '45 seconds') as online,
      (select body from chat_messages m where m.conversation_id = c.id order by id desc limit 1) as last_body,
      (select sender from chat_messages m where m.conversation_id = c.id order by id desc limit 1) as last_sender,
      (select max(created_at) from chat_messages m where m.conversation_id = c.id) as last_at
    from chat_conversations c
    left join admins a on a.id = c.assigned_admin_id
    where c.assigned_admin_id is null or c.assigned_admin_id = ${me.id}
    order by (c.closed_at is not null), last_at desc nulls last`;
  // Everyone browsing the site right now (a heartbeat in the last 45 seconds).
  // A visitor already being helped by another admin shows as a plain "Visitor" to everyone else.
  const visitors = await sql`
    select v.id, v.path, v.arrived_at,
      case when c.assigned_admin_id is null or c.assigned_admin_id = ${me.id} then c.name end as name,
      (select e.title from events e where '/events/' || e.slug = v.path) as page_title
    from visitors v left join chat_conversations c on c.id = v.conversation_id
    where v.last_seen > now() - interval '45 seconds'
    order by v.arrived_at desc`;
  return NextResponse.json({ conversations, visitors, me: { id: me.id, role: me.role } });
}

// Admin: reply. The first admin to reply takes the chat.
export async function POST(req: Request) {
  const me = await currentAdmin();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, body } = await req.json().catch(() => ({}));
  const text = String(body ?? "").trim().slice(0, 1000);
  if (!UUID.test(String(id)) || !text) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const sql = await db();
  const [conv] = await sql<{ closed: boolean }[]>`select closed_at is not null as closed from chat_conversations where id = ${id}`;
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conv.closed) return NextResponse.json({ error: "closed" }, { status: 409 });

  // Atomic claim: succeeds only if the chat is unassigned or already mine, so two admins can't both take it.
  const claimed = await sql`
    update chat_conversations set assigned_admin_id = ${me.id}, admin_typing_at = null
    where id = ${id} and (assigned_admin_id is null or assigned_admin_id = ${me.id})
    returning id`;
  if (claimed.length === 0) return NextResponse.json({ error: "assigned" }, { status: 403 });

  await sql`insert into chat_messages (conversation_id, sender, body) values (${id}, 'admin', ${text})`;
  return NextResponse.json({ ok: true });
}

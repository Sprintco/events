import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Admin: "I'm typing in this conversation" ping. The visitor sees it for a few seconds.
// Only for chats that are unassigned or mine, so another admin's typing never shows up in someone else's chat.
export async function POST(req: Request) {
  const me = await currentAdmin();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!UUID.test(String(id))) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const sql = await db();
  await sql`update chat_conversations set admin_typing_at = now()
            where id = ${id} and (assigned_admin_id is null or assigned_admin_id = ${me.id})`;
  return NextResponse.json({ ok: true });
}

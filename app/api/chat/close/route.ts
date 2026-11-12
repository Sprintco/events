import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Visitor: end the conversation. The widget then starts a brand-new one next time.
export async function POST(req: Request) {
  const { id } = await req.json().catch(() => ({}));
  if (!UUID.test(String(id))) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const sql = await db();
  await sql`update chat_conversations
            set closed_at = coalesce(closed_at, now()), admin_typing_at = null, visitor_typing_at = null
            where id = ${id}`;
  return NextResponse.json({ ok: true });
}

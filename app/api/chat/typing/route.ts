import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Visitor: "I'm typing" ping. The admin sees it for a few seconds.
export async function POST(req: Request) {
  const { id } = await req.json().catch(() => ({}));
  if (!UUID.test(String(id))) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const sql = await db();
  await sql`update chat_conversations set visitor_typing_at = now() where id = ${id}`;
  return NextResponse.json({ ok: true });
}

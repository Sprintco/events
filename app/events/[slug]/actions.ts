"use server";

import { db } from "@/lib/db";

export type RegisterState = { ok?: boolean; error?: string };

export async function register(_prev: RegisterState, form: FormData): Promise<RegisterState> {
  const eventId = Number(form.get("eventId"));
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);

  if (!Number.isInteger(eventId)) return { error: "Invalid event." };
  if (!name) return { error: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email." };

  const sql = await db();
  const [event] = await sql`select id from events where id = ${eventId}`;
  if (!event) return { error: "Event not found." };

  const [existing] = await sql`select id from registrations where event_id = ${eventId} and email = ${email}`;
  if (!existing) {
    await sql`insert into registrations (event_id, name, email) values (${eventId}, ${name}, ${email})`;
  }
  return { ok: true };
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { endAdminSession, isAdmin, signIn, startAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { COVER_KEY, deleteCover } from "@/lib/s3";

export async function login(_prev: { error?: string }, form: FormData) {
  const r = await signIn(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
  if (!r.admin) return { error: r.error };
  await startAdminSession(r.admin);
  redirect(r.admin.must_change ? "/admin/account" : "/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/");
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "event";

type EventInput = {
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  price: number;
  isPrivate: boolean;
  coverUrl: string | null;
};

/** Shared validation for creating and editing an event. */
function parseEventForm(form: FormData): { error: string } | { data: EventInput } {
  const title = String(form.get("title") ?? "").trim().slice(0, 150);
  const description = String(form.get("description") ?? "").trim().slice(0, 5000);
  const location = String(form.get("location") ?? "").trim().slice(0, 200);
  const startsAt = new Date(String(form.get("startsAt") ?? ""));
  const price = Number(form.get("price") ?? 0);
  const isPrivate = form.get("isPrivate") === "on";
  const rawCover = String(form.get("coverUrl") ?? "");
  const coverUrl = COVER_KEY.test(rawCover.replace(/^\/media\//, "")) ? rawCover : null;

  if (!title) return { error: "Title is required." };
  if (Number.isNaN(startsAt.getTime())) return { error: "Pick a valid date and time." };
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) return { error: "Enter a valid price in USD." };

  return { data: { title, description, location, startsAt, price, isPrivate, coverUrl } };
}

export async function createEvent(_prev: { error?: string; ok?: boolean }, form: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");

  const parsed = parseEventForm(form);
  if ("error" in parsed) return { error: parsed.error };
  const { title, description, location, startsAt, price, isPrivate, coverUrl } = parsed.data;

  const sql = await db();
  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
  await sql`insert into events (slug, title, description, location, starts_at, price_usd, is_private, cover_url)
            values (${slug}, ${title}, ${description}, ${location}, ${startsAt}, ${price}, ${isPrivate}, ${coverUrl})`;

  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/");
  return { ok: true };
}

export async function updateEvent(_prev: { error?: string; ok?: boolean }, form: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");

  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return { error: "Invalid event." };

  const parsed = parseEventForm(form);
  if ("error" in parsed) return { error: parsed.error };
  const { title, description, location, startsAt, price, isPrivate, coverUrl } = parsed.data;

  const sql = await db();
  const [old] = await sql<{ slug: string; cover_url: string | null }[]>`select slug, cover_url from events where id = ${id}`;
  if (!old) return { error: "That event no longer exists." };

  // The slug (and so the public URL) stays the same when the title changes.
  await sql`update events set title = ${title}, description = ${description}, location = ${location},
            starts_at = ${startsAt}, price_usd = ${price}, is_private = ${isPrivate}, cover_url = ${coverUrl}
            where id = ${id}`;

  // The cover was replaced or removed: free the old image in the bucket.
  if (old.cover_url && old.cover_url !== coverUrl) await deleteCover(old.cover_url);

  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath(`/events/${old.slug}`);
  revalidatePath("/");
  redirect("/admin");
}

export async function deleteEvent(form: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  const sql = await db();
  const rows = await sql<{ cover_url: string | null }[]>`delete from events where id = ${id} returning cover_url`;
  await deleteCover(rows[0]?.cover_url ?? null);
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/");
}

export async function togglePaid(form: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  const sql = await db();
  await sql`update registrations set paid = not paid where id = ${id}`;
  revalidatePath("/admin");
}

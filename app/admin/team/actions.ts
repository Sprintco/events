"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  currentAdmin, hashPassword, issueRecoveryCodes, temporaryPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";

export type Credentials = { name: string; email: string; password: string; codes?: string[] };
export type TeamState = { error?: string; credentials?: Credentials };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireSuper() {
  const me = await currentAdmin();
  if (!me) redirect("/admin/login");
  if (me.role !== "super") redirect("/admin");
  return me;
}

/** Creates an admin with a one-time password and recovery codes, shown to the super admin once. */
export async function onboardAdmin(_prev: TeamState, form: FormData): Promise<TeamState> {
  await requireSuper();
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const role = form.get("role") === "super" ? "super" : "admin";
  if (!name) return { error: "Enter a name." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email." };

  const sql = await db();
  const [exists] = await sql`select 1 as x from admins where email = ${email}`;
  if (exists) return { error: "An admin with that email already exists." };

  const password = temporaryPassword();
  const [a] = await sql<{ id: number }[]>`
    insert into admins (email, name, role, password_hash, must_change)
    values (${email}, ${name}, ${role}, ${hashPassword(password)}, true) returning id`;
  const codes = await issueRecoveryCodes(a.id);
  revalidatePath("/admin/team");
  return { credentials: { name, email, password, codes } };
}

/** Gives an admin a new one-time password (for someone locked out who has no recovery codes). */
export async function resetAdminPassword(_prev: TeamState, form: FormData): Promise<TeamState> {
  const me = await requireSuper();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return { error: "Invalid admin." };
  const sql = await db();
  const password = temporaryPassword();
  const rows = await sql<{ name: string; email: string }[]>`
    update admins set password_hash = ${hashPassword(password)}, must_change = true
    where id = ${id} returning name, email`;
  if (!rows[0]) return { error: "That admin no longer exists." };
  if (id === me.id) redirect("/admin/login");
  revalidatePath("/admin/team");
  return { credentials: { ...rows[0], password } };
}

export async function setAdminActive(form: FormData) {
  const me = await requireSuper();
  const id = Number(form.get("id"));
  const active = form.get("active") === "true";
  if (!Number.isInteger(id) || id === me.id) return;
  const sql = await db();
  await sql`update admins set active = ${active} where id = ${id}`;
  revalidatePath("/admin/team");
}

export async function removeAdmin(form: FormData) {
  const me = await requireSuper();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id === me.id) return;
  const sql = await db();
  await sql`delete from admins where id = ${id}`;
  revalidatePath("/admin/team");
}

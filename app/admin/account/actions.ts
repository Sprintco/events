"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  LOCKED_MESSAGE, clearFailures, consumeRecoveryCode, currentAdmin, hashPassword, issueRecoveryCodes,
  recordFailure, startAdminSession, tooManyAttempts, validNewPassword, verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";

export type AccountState = { error?: string; ok?: boolean; codes?: string[] };

export async function changePassword(_prev: AccountState, form: FormData): Promise<AccountState> {
  const me = await currentAdmin();
  if (!me) redirect("/admin/login");
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  const key = `change:${me.id}`;
  if (await tooManyAttempts(key)) return { error: LOCKED_MESSAGE };
  if (!verifyPassword(current, me.password_hash)) {
    await recordFailure(key);
    return { error: "Your current password is wrong." };
  }
  const bad = validNewPassword(next);
  if (bad) return { error: bad };
  if (next !== confirm) return { error: "The new passwords do not match." };
  if (next === current) return { error: "Choose a password you have not used just now." };

  await clearFailures(key);
  const hash = hashPassword(next);
  const sql = await db();
  await sql`update admins set password_hash = ${hash}, must_change = false where id = ${me.id}`;
  await startAdminSession({ id: me.id, password_hash: hash }); // the old session is no longer valid
  redirect("/admin"); // already signed in: straight to the dashboard
}

export async function regenerateCodes(_prev: AccountState): Promise<AccountState> {
  const me = await currentAdmin();
  if (!me) redirect("/admin/login");
  const codes = await issueRecoveryCodes(me.id);
  revalidatePath("/admin/account");
  return { codes };
}

/** Self-service reset: an email plus one unused recovery code, no email delivery needed. */
export async function resetWithRecoveryCode(_prev: AccountState, form: FormData): Promise<AccountState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const code = String(form.get("code") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  const key = `recover:${email}`;
  if (await tooManyAttempts(key)) return { error: LOCKED_MESSAGE };
  const bad = validNewPassword(next);
  if (bad) return { error: bad };
  if (next !== confirm) return { error: "The new passwords do not match." };

  const sql = await db();
  const [a] = await sql<{ id: number }[]>`select id from admins where email = ${email} and active`;
  if (!a || !(await consumeRecoveryCode(a.id, code))) {
    await recordFailure(key);
    return { error: "That email and recovery code do not match." };
  }
  await clearFailures(key);
  const hash = hashPassword(next);
  await sql`update admins set password_hash = ${hash}, must_change = false where id = ${a.id}`;
  await startAdminSession({ id: a.id, password_hash: hash }); // proved identity with the code, so sign them in
  redirect("/admin");
}

import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "./db";

const COOKIE = "admin_session";
const WEEK = 60 * 60 * 24 * 7;

export type Admin = {
  id: number;
  email: string;
  name: string;
  role: "super" | "admin";
  active: boolean;
  must_change: boolean;
  password_hash: string;
  created_at: string;
  last_login_at: string | null;
};

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

// ---------- passwords ----------

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [alg, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  return same(scryptSync(pw, salt, 64).toString("hex"), hash);
}

const PW_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const pick = (alphabet: string, n: number) =>
  Array.from({ length: n }, () => alphabet[randomInt(alphabet.length)]).join("");

/** A readable one-time password for new or reset admins. They must change it at first sign-in. */
export const temporaryPassword = () => pick(PW_ALPHABET, 12);

export const validNewPassword = (pw: string) =>
  pw.length >= 10 ? null : "Use at least 10 characters.";

// ---------- recovery codes (self-service reset without email) ----------

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const normCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");
const codeHash = (c: string) => createHash("sha256").update(normCode(c)).digest("hex");

/** Replaces all of an admin's recovery codes with 8 fresh ones and returns them (shown once). */
export async function issueRecoveryCodes(adminId: number) {
  const sql = await db();
  const codes = Array.from({ length: 8 }, () => {
    const c = pick(CODE_ALPHABET, 10);
    return `${c.slice(0, 5)}-${c.slice(5)}`;
  });
  await sql`delete from admin_recovery_codes where admin_id = ${adminId}`;
  for (const c of codes) {
    await sql`insert into admin_recovery_codes (admin_id, code_hash) values (${adminId}, ${codeHash(c)})`;
  }
  return codes;
}

/** Marks a recovery code used. Returns false when it is wrong or already spent. */
export async function consumeRecoveryCode(adminId: number, code: string) {
  const sql = await db();
  const rows = await sql<{ id: number }[]>`
    update admin_recovery_codes set used_at = now()
    where id = (select id from admin_recovery_codes
                where admin_id = ${adminId} and code_hash = ${codeHash(code)} and used_at is null limit 1)
    returning id`;
  return rows.length > 0;
}

export async function unusedCodeCount(adminId: number) {
  const sql = await db();
  const [r] = await sql<{ n: number }[]>`
    select count(*)::int as n from admin_recovery_codes where admin_id = ${adminId} and used_at is null`;
  return r.n;
}

// ---------- brute-force limit ----------

const WINDOW = "15 minutes";
const MAX_FAILS = 8;

export async function tooManyAttempts(key: string) {
  const sql = await db();
  const [r] = await sql<{ n: number }[]>`
    select count(*)::int as n from admin_attempts
    where key = ${key} and created_at > now() - interval '15 minutes'`;
  return r.n >= MAX_FAILS;
}
export async function recordFailure(key: string) {
  const sql = await db();
  await sql`insert into admin_attempts (key) values (${key})`;
  await sql`delete from admin_attempts where created_at < now() - interval '1 day'`;
}
export async function clearFailures(key: string) {
  const sql = await db();
  await sql`delete from admin_attempts where key = ${key}`;
}
export const LOCKED_MESSAGE = `Too many attempts. Try again in ${WINDOW}.`;

// ---------- sessions ----------

function secret() {
  return process.env.AUTH_SECRET ?? process.env.ADMIN_PASSWORD ?? "dev-secret";
}
// The signature covers the password hash, so changing a password signs that admin out everywhere.
const sign = (id: number, exp: number, passwordHash: string) =>
  createHmac("sha256", secret()).update(`${id}.${exp}.${passwordHash}`).digest("hex");

export async function startAdminSession(admin: Pick<Admin, "id" | "password_hash">) {
  const exp = Math.floor(Date.now() / 1000) + WEEK;
  (await cookies()).set(COOKIE, `${admin.id}.${exp}.${sign(admin.id, exp, admin.password_hash)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: WEEK,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in admin, or null. */
export async function currentAdmin(): Promise<Admin | null> {
  const v = (await cookies()).get(COOKIE)?.value ?? "";
  const [idStr, expStr, sig] = v.split(".");
  const id = Number(idStr);
  const exp = Number(expStr);
  if (!Number.isInteger(id) || !exp || !sig || exp < Date.now() / 1000) return null;
  const sql = await db();
  const [a] = await sql<Admin[]>`select * from admins where id = ${id} and active`;
  if (!a || !same(sig, sign(a.id, exp, a.password_hash))) return null;
  return a;
}

export async function isAdmin() {
  return (await currentAdmin()) !== null;
}

export async function isSuperAdmin() {
  return (await currentAdmin())?.role === "super";
}

/**
 * Checks an email and password. The very first sign-in with ADMIN_EMAIL / ADMIN_PASSWORD
 * (while no admins exist yet) creates the owner account; after that the env values are ignored.
 */
export async function signIn(emailRaw: string, password: string): Promise<{ admin?: Admin; error?: string }> {
  const email = emailRaw.trim().toLowerCase();
  const key = `login:${email}`;
  if (await tooManyAttempts(key)) return { error: LOCKED_MESSAGE };
  const sql = await db();

  let [a] = await sql<Admin[]>`select * from admins where email = ${email}`;
  if (!a) {
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from admins`;
    const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (n === 0 && envEmail && process.env.ADMIN_PASSWORD && same(email, envEmail) && same(password, process.env.ADMIN_PASSWORD)) {
      [a] = await sql<Admin[]>`
        insert into admins (email, name, role, password_hash) values (${email}, 'Owner', 'super', ${hashPassword(password)})
        returning *`;
    }
  }
  if (!a || !a.active || !verifyPassword(password, a.password_hash)) {
    await recordFailure(key);
    return { error: "Invalid email or password." };
  }
  await clearFailures(key);
  await sql`update admins set last_login_at = now() where id = ${a.id}`;
  return { admin: a };
}

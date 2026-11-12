import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "admin_session";

function token() {
  const secret = process.env.ADMIN_PASSWORD ?? "dev-secret";
  return "admin." + createHmac("sha256", secret).update("admin").digest("hex");
}

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function checkCredentials(email: string, password: string) {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_EMAIL) return false;
  return same(email.trim().toLowerCase(), process.env.ADMIN_EMAIL.toLowerCase()) &&
    same(password, process.env.ADMIN_PASSWORD);
}

export async function startAdminSession() {
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const v = (await cookies()).get(COOKIE)?.value ?? "";
  return same(v, token());
}

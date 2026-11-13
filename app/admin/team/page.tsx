import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Admins, Onboard, type AdminRow } from "./team-client";

async function Team() {
  const me = await currentAdmin();
  if (!me) redirect("/admin/login");
  if (me.must_change) redirect("/admin/account");
  if (me.role !== "super") redirect("/admin");

  const sql = await db();
  const admins = await sql<AdminRow[]>`
    select id, name, email, role, active, must_change, last_login_at
    from admins order by (role = 'super') desc, created_at`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
      <h1 className="mt-2 text-3xl font-bold">Team</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Onboard admins and manage who can sign in. Each new admin gets a one-time password and recovery codes
        they can use to reset their own password later.
      </p>
      <div className="mt-6 space-y-6">
        <Onboard />
        <Admins admins={admins} meId={me.id} />
      </div>
    </main>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-muted-foreground sm:px-6">Loading…</p>}>
      <Team />
    </Suspense>
  );
}

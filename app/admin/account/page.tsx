import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin, unusedCodeCount } from "@/lib/auth";
import { ChangePasswordForm, RecoveryCodes } from "./account-forms";

async function Account() {
  const me = await currentAdmin();
  if (!me) redirect("/admin/login");
  const remaining = await unusedCodeCount(me.id);
  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      {!me.must_change && (
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
      )}
      <h1 className="mt-2 text-3xl font-bold">My account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {me.name} · {me.email} · {me.role === "super" ? "Super admin" : "Admin"}
      </p>
      <div className="mt-6 space-y-6">
        <ChangePasswordForm forced={me.must_change} />
        {!me.must_change && <RecoveryCodes remaining={remaining} />}
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-muted-foreground sm:px-6">Loading…</p>}>
      <Account />
    </Suspense>
  );
}

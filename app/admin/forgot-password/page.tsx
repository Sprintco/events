"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetWithRecoveryCode, type AccountState } from "../account/actions";

const input =
  "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AccountState, FormData>(resetWithRecoveryCode, {});
  return (
    <main className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email and one of the recovery codes you were given. Each code works once. No codes left?
        Ask a super admin to reset your password.
      </p>

      {state.ok ? (
        <div className="mt-6 rounded-2xl border bg-card p-6 text-center">
          <p className="font-semibold">Password updated</p>
          <Link href="/admin/login" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
            Sign in
          </Link>
        </div>
      ) : (
        <form action={action} className="mt-6 space-y-3 rounded-2xl border bg-card p-6">
          <input name="email" type="email" placeholder="Email" required autoComplete="email" className={input} />
          <input name="code" placeholder="Recovery code (XXXXX-XXXXX)" required autoComplete="off" className={`${input} font-mono uppercase`} />
          <input name="next" type="password" placeholder="New password (10+ characters)" required autoComplete="new-password" className={input} />
          <input name="confirm" type="password" placeholder="Repeat new password" required autoComplete="new-password" className={input} />
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <button disabled={pending} className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {pending ? "Resetting…" : "Reset password"}
          </button>
        </form>
      )}
      <Link href="/admin/login" className="mt-4 text-center text-sm text-muted-foreground hover:text-foreground">
        Back to sign in
      </Link>
    </main>
  );
}

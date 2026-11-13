"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "../actions";

const input =
  "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {} as { error?: string });
  return (
    <main className="mx-auto flex max-w-sm flex-col px-4 py-20">
      <h1 className="text-2xl font-bold">Admin sign in</h1>
      <form action={action} className="mt-6 space-y-3 rounded-2xl border bg-card p-6">
        <input name="email" type="email" placeholder="Email" required className={input} />
        <input name="password" type="password" placeholder="Password" required className={input} />
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <button
          disabled={pending}
          className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <Link href="/admin/forgot-password" className="mt-4 text-center text-sm text-muted-foreground hover:text-foreground">
        Forgot your password?
      </Link>
    </main>
  );
}

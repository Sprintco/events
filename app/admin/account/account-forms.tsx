"use client";

import { useActionState } from "react";
import { changePassword, regenerateCodes, type AccountState } from "./actions";
import { CopyBox } from "../copy-box";

const input =
  "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-3 rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">{forced ? "Choose your own password" : "Change password"}</h2>
      {forced && <p className="text-sm text-muted-foreground">You signed in with a one-time password. Set your own to continue.</p>}
      <input name="current" type="password" placeholder={forced ? "One-time password" : "Current password"} required autoComplete="current-password" className={input} />
      <input name="next" type="password" placeholder="New password (10+ characters)" required autoComplete="new-password" className={input} />
      <input name="confirm" type="password" placeholder="Repeat new password" required autoComplete="new-password" className={input} />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium text-green-600">Password updated.</p>}
      <button disabled={pending} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

export function RecoveryCodes({ remaining }: { remaining: number }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(regenerateCodes, {});
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">Recovery codes</h2>
      <p className="text-sm text-muted-foreground">
        If you forget your password you can reset it yourself with one of these codes, no email needed.
        Each works once. Generating new codes cancels the old ones.
      </p>
      {!state.codes && (
        <p className={`text-sm font-medium ${remaining === 0 ? "text-destructive" : ""}`}>
          {remaining === 0 ? "You have no unused recovery codes." : `${remaining} unused code${remaining === 1 ? "" : "s"} left.`}
        </p>
      )}
      {state.codes && (
        <CopyBox title="Your new recovery codes" lines={state.codes} note="Save these somewhere safe now. They are not shown again." />
      )}
      <form action={action}>
        <button disabled={pending} className="rounded-full border px-5 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60">
          {pending ? "Generating…" : remaining === 0 && !state.codes ? "Generate codes" : "Generate new codes"}
        </button>
      </form>
    </section>
  );
}

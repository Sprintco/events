"use client";

import { useActionState } from "react";
import { onboardAdmin, removeAdmin, resetAdminPassword, setAdminActive, type TeamState } from "./actions";
import { CopyBox } from "../copy-box";

const input =
  "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export type AdminRow = {
  id: number;
  name: string;
  email: string;
  role: "super" | "admin";
  active: boolean;
  must_change: boolean;
  last_login_at: string | null;
};

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never";

function Credentials({ state }: { state: TeamState }) {
  const c = state.credentials;
  if (!c) return null;
  return (
    <CopyBox
      title={`Sign-in details for ${c.name}`}
      lines={[
        `Email: ${c.email}`,
        `One-time password: ${c.password}`,
        ...(c.codes ? ["", "Recovery codes (each works once):", ...c.codes] : []),
      ]}
      note="Send these to them privately. They are not shown again, and they must choose their own password at first sign-in."
    />
  );
}

export function Onboard() {
  const [state, action, pending] = useActionState<TeamState, FormData>(onboardAdmin, {});
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">Onboard an admin</h2>
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <input name="name" placeholder="Full name" required maxLength={80} className={input} />
        <input name="email" type="email" placeholder="Email" required className={input} />
        <select name="role" defaultValue="admin" className={input}>
          <option value="admin">Admin: manage events and chat</option>
          <option value="super">Super admin: also manage the team</option>
        </select>
        <button disabled={pending} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {pending ? "Creating…" : "Create admin"}
        </button>
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Credentials state={state} />
    </section>
  );
}

export function Admins({ admins, meId }: { admins: AdminRow[]; meId: number }) {
  const [reset, resetAction, resetting] = useActionState<TeamState, FormData>(resetAdminPassword, {});
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Team ({admins.length})</h2>
      {reset.error && <p className="text-sm text-destructive">{reset.error}</p>}
      <Credentials state={reset} />
      <ul className="divide-y rounded-2xl border bg-card">
        {admins.map((a) => {
          const me = a.id === meId;
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {a.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
              </span>
              <div className="min-w-0 flex-1 basis-48">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {a.name}
                  {me && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">You</span>}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{a.role === "super" ? "Super admin" : "Admin"}</span>
                  {!a.active && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive">Deactivated</span>}
                  {a.must_change && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">Not signed in yet</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{a.email} · Last sign-in {when(a.last_login_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form
                  action={resetAction}
                  onSubmit={(e) => {
                    if (!confirm(`Reset ${a.name}'s password? Their current one stops working.`)) e.preventDefault();
                  }}>
                  <input type="hidden" name="id" value={a.id} />
                  <button disabled={resetting} className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
                    Reset password
                  </button>
                </form>
                {!me && (
                  <>
                    <form action={setAdminActive}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="active" value={String(!a.active)} />
                      <button className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
                        {a.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                    <form
                      action={removeAdmin}
                      onSubmit={(e) => {
                        if (!confirm(`Remove ${a.name}? They will lose access for good.`)) e.preventDefault();
                      }}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="rounded-full border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10">Remove</button>
                    </form>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

"use client";

import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { register, type RegisterState } from "./actions";

const input =
  "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function RegisterForm({ eventId, slug, price }: { eventId: number; slug: string; price: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<RegisterState, FormData>(register, {});

  if (state.ok) {
    return (
      <div className="mt-5 rounded-xl bg-secondary p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-primary">
          <CheckCircle2 className="size-5" /> You&apos;re registered!
        </p>
        <p className="mt-2 text-muted-foreground">
          {price > 0
            ? "We'll contact you by email with payment details to confirm your spot."
            : "See you there. We'll email you the details."}
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-5 w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90"
      >
        Register for this event
      </button>
    );
  }

  return (
    <form action={action} className="mt-5 space-y-3" data-slug={slug}>
      <input type="hidden" name="eventId" value={eventId} />
      <input name="name" placeholder="Full name" required maxLength={120} className={input} />
      <input name="email" type="email" placeholder="Email address" required maxLength={200} className={input} />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <button
        disabled={pending}
        className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Registering…" : "Confirm registration"}
      </button>
    </form>
  );
}

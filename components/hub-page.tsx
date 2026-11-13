"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Card, Hub } from "@/lib/hubs";

const card =
  "flex w-full items-start gap-4 rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow";

function CardLink({ c }: { c: Card }) {
  const inner = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{c.title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{c.desc}</span>
      </span>
      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
    </>
  );
  return c.chat ? (
    <button onClick={() => window.dispatchEvent(new Event("open-support-chat"))} className={card}>
      {inner}
    </button>
  ) : (
    <Link href={c.href ?? "/"} className={card}>
      {inner}
    </Link>
  );
}

/** Shared layout for the Company, Safety, Legal and Help pages. Content comes from lib/hubs.ts. */
export function HubPage({ hub }: { hub: Hub }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{hub.eyebrow}</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">{hub.title}</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{hub.intro}</p>

      {hub.sections.map((s) => (
        <section key={s.title} className="mt-10 border-t pt-10">
          <h2 className="text-xl font-bold">{s.title}</h2>
          {s.text?.map((t) => (
            <p key={t} className="mt-3 leading-7 text-foreground/85">{t}</p>
          ))}
          {s.callout && (
            <div className="mt-4 rounded-3xl border bg-card p-6 shadow-sm">
              {s.callout.text.map((t, i) => (
                <p key={t} className={i === 0 ? "text-lg leading-7" : "mt-3 leading-7 text-foreground/80"}>{t}</p>
              ))}
              <Link href={s.callout.link.href} className="mt-4 inline-block text-sm font-bold text-primary hover:underline">
                {s.callout.link.label}
              </Link>
            </div>
          )}
          {s.cards && (
            <div className="mt-5 space-y-3">
              {s.cards.map((c) => <CardLink key={c.title} c={c} />)}
            </div>
          )}
        </section>
      ))}
    </main>
  );
}

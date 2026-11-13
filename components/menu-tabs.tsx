"use client";

import { useState } from "react";
import type { MenuSection } from "@/lib/menu";

function Sections({ sections }: { sections: MenuSection[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-14">
      {sections.map((s) => (
        <section key={s.title}>
          <h2 className="font-display text-3xl font-bold">{s.title}</h2>
          {s.note && <p className="mt-1 text-sm italic text-muted-foreground">{s.note}</p>}
          <ul className="mt-6 divide-y">
            {s.items.map((it) => (
              <li key={it.name} className="py-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-semibold">{it.name}</span>
                  <span className="mb-1 flex-1 border-b border-dotted border-muted-foreground/40" />
                  <span className="font-display text-lg font-bold text-primary">{it.price}</span>
                </div>
                {it.desc && <p className="mt-1 text-sm italic text-muted-foreground">{it.desc}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function MenuTabs({ dinner, drinks }: { dinner: MenuSection[]; drinks: MenuSection[] }) {
  const [tab, setTab] = useState<"dinner" | "drinks">("dinner");
  const btn = (on: boolean) =>
    `rounded-full px-7 py-2.5 text-sm font-semibold uppercase tracking-wider transition ${
      on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
    }`;
  return (
    <>
      <div role="tablist" className="mx-auto flex w-fit gap-1 rounded-full border bg-card p-1">
        <button role="tab" aria-selected={tab === "dinner"} onClick={() => setTab("dinner")} className={btn(tab === "dinner")}>
          Dinner menu
        </button>
        <button role="tab" aria-selected={tab === "drinks"} onClick={() => setTab("drinks")} className={btn(tab === "drinks")}>
          Drink menu
        </button>
      </div>
      <div className="mt-12">
        <Sections sections={tab === "dinner" ? dinner : drinks} />
      </div>
      <p className="mx-auto mt-14 max-w-3xl text-center text-xs text-muted-foreground">
        Consuming raw or undercooked meats, poultry, seafood or eggs may increase your risk of foodborne illness.
      </p>
    </>
  );
}

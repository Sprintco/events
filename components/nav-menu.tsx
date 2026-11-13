"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NAV_ART } from "./nav-art";
import {
  CalendarDays, Gift, Lock, Sparkles, Ticket, CalendarCheck, Flame, MapPin, CalendarClock, Wallet, Utensils,
} from "lucide-react";

type Menu = { label: string; items: Item[] };

type Item = { href?: string; chat?: boolean; icon: React.ComponentType<{ className?: string }>; title: string; desc: string };
const MENUS: Menu[] = [
  {
    label: "Browse",
    items: [
      { href: "/events", icon: CalendarDays, title: "All events", desc: "Everything coming up" },
      { href: "/private-events", icon: Lock, title: "Private events", desc: "Invite-only gatherings" },
      { href: "/events?filter=free", icon: Gift, title: "Free events", desc: "No ticket needed" },
    ],
  },
  {
    label: "Discover",
    items: [
      { href: "/events?filter=trending", icon: Flame, title: "Trending", desc: "What everyone is joining" },
      { href: "/events?filter=week", icon: CalendarClock, title: "This week", desc: "Plan your week ahead" },
      { href: "/events?filter=near", icon: MapPin, title: "Near you", desc: "Events around your city" },
      { href: "/events?filter=new", icon: Sparkles, title: "New", desc: "Just added by the host" },
    ],
  },
  {
    label: "Tickets",
    items: [
      { href: "/pricing", icon: Wallet, title: "Pricing", desc: "See what each event costs" },
      { href: "/menu", icon: Utensils, title: "Menu", desc: "Dinner and drinks" },
    ],
  },
  {
    label: "Reservation",
    items: [
      { chat: true, icon: CalendarCheck, title: "Reserve a table", desc: "Chat with our team" },
      { href: "/private-events", icon: Lock, title: "Private events", desc: "Book the venue" },
      { href: "/menu", icon: Utensils, title: "View the menu", desc: "Before you book" },
    ],
  },
];

function Dropdown({ menu }: { menu: Menu }) {
  const [open, setOpen] = useState(false);
  const Art = NAV_ART[menu.label];
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => { clearTimeout(timer.current); setOpen(true); };
  const hide = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(false), 120); };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`group/nav relative inline-flex items-center overflow-hidden rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
          open ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {Art && (
          <span
            aria-hidden
            className={`nav-art pointer-events-none absolute inset-0 text-[var(--nav-art)] transition-opacity duration-300 ${
              open ? "opacity-60" : "opacity-20 group-hover/nav:opacity-50"
            }`}
          >
            <Art />
          </span>
        )}
        <span className="relative">{menu.label}</span>
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <div role="menu" className="rounded-2xl border bg-card p-2 shadow-xl">
            {menu.items.map(({ icon: Icon, title, desc, href, chat }) => {
              const body = (
                <>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="block text-xs text-muted-foreground">{desc}</span>
                  </span>
                </>
              );
              const cls = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary";
              return chat ? (
                <button
                  key={title}
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    window.dispatchEvent(new Event("open-support-chat"));
                  }}
                  className={cls}>
                  {body}
                </button>
              ) : (
                <Link key={title} href={href ?? "/events"} role="menuitem" onClick={() => setOpen(false)} className={cls}>
                  {body}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function NavMenus() {
  return (
    <div className="hidden items-center gap-2 lg:flex">
      {MENUS.map((m) => <Dropdown key={m.label} menu={m} />)}
    </div>
  );
}

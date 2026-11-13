"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell, CalendarDays, ChevronDown, CircleHelp, Crown, LayoutDashboard, LogOut, MessageCircle, MessagesSquare,
  Sun, User, Volume2, VolumeX,
} from "lucide-react";
import { Popover } from "./popover";
import { logout } from "@/app/admin/actions";
import { getChatUnread, type ChatUnread } from "@/lib/chat-events";
import { isSoundOn, playChime, setSoundOn, unlockAudio } from "@/lib/sound";
import {
  TEXT_SIZES, THEMES, applyTextSize, applyTheme, readAppearance, type TextSizeId, type ThemeId,
} from "@/lib/theme";

const iconBtn =
  "relative grid size-10 place-items-center rounded-xl bg-secondary text-foreground hover:bg-secondary/70";

const row = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary";

const openChat = () => window.dispatchEvent(new Event("open-support-chat"));

/* ---------- Crown ---------- */

function CrownMenu() {
  return (
    <Popover
      label="Private events"
      buttonClass="grid h-10 place-items-center rounded-xl bg-gradient-to-b from-[#fbc95a] to-[#f7aa14] px-3 text-[#1e120f] shadow-sm ring-1 ring-[#f7aa14]/60 hover:brightness-105 sm:px-4"
      button={
        <span className="flex items-center gap-2 text-sm font-bold">
          <Crown className="size-5" />
          <span className="hidden sm:inline">Get tickets</span>
        </span>
      }
    >
      {(close) => (
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-[#f7aa14]/20 text-[#b36b00]">
              <Crown className="size-6" />
            </span>
            <p className="text-lg font-bold">Private events</p>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Unlock exclusive gatherings and reserve before they fill up.
          </p>
          <Link
            href="/events"
            onClick={close}
            className="mt-4 block rounded-xl bg-gradient-to-r from-[#f7aa14] to-[#fbc95a] py-2.5 text-center text-sm font-bold text-[#1e120f]"
          >
            Browse events
          </Link>
        </div>
      )}
    </Popover>
  );
}

/* ---------- Notifications ---------- */

type Notice = { id: string; title: string; body: string; href?: string };

type Conv = { id: string; name: string; closed_at: string | null; last_body: string | null; last_sender: string | null };

function Notifications({ admin }: { admin: boolean }) {
  const [chat, setChat] = useState<ChatUnread>({ count: 0, latest: "" });
  const [waiting, setWaiting] = useState<Notice[]>([]);
  const knownVisitorAt = useRef<number | null>(null); // newest visitor message already known (for the chime)
  const knownArrival = useRef<number | null>(null); // newest site arrival already known (for the chime)
  const [arrivals, setArrivals] = useState<Notice[]>([]);

  useEffect(() => {
    unlockAudio();
  }, []);

  // Visitors: unread support replies, shared by the chat widget.
  useEffect(() => {
    if (admin) return;
    queueMicrotask(() => setChat(getChatUnread()));
    const on = (e: Event) => setChat((e as CustomEvent<ChatUnread>).detail);
    window.addEventListener("chat-unread", on);
    return () => window.removeEventListener("chat-unread", on);
  }, [admin]);

  // Admin: conversations waiting for a reply.
  useEffect(() => {
    if (!admin) return;
    const tick = async () => {
      if (document.hidden) return;
      const r = await fetch("/api/chat/admin", { cache: "no-store" }).catch(() => null);
      if (!r?.ok) return;
      const data = await r.json();
      const convs: (Conv & { last_at: string | null })[] = data.conversations ?? [];
      const visitors: { id: string; path: string; arrived_at: string; name: string | null }[] = data.visitors ?? [];

      // Someone just landed on the site: chime once, and list them for a couple of minutes.
      const newestArrival = Math.max(0, ...visitors.map((v) => Date.parse(v.arrived_at)));
      if (knownArrival.current === null) knownArrival.current = newestArrival;
      else if (newestArrival > knownArrival.current) {
        knownArrival.current = newestArrival;
        playChime();
      }
      setArrivals(
        visitors
          .filter((v) => Date.now() - Date.parse(v.arrived_at) < 120000)
          .map((v) => ({
            id: `visit-${v.id}`,
            title: `${v.name ?? "A visitor"} is on the site`,
            body: `Viewing ${v.path}`,
            href: "/admin/chat",
          })),
      );
      const open = convs.filter((c) => !c.closed_at && c.last_sender === "visitor");

      // Chime when a NEW visitor message arrives (works on any admin page).
      const newest = Math.max(0, ...open.map((c) => (c.last_at ? Date.parse(c.last_at) : 0)));
      if (knownVisitorAt.current === null) knownVisitorAt.current = newest;
      else if (newest > knownVisitorAt.current) {
        knownVisitorAt.current = newest;
        playChime();
      }

      setWaiting(open.map((c) => ({ id: c.id, title: c.name, body: c.last_body ?? "", href: "/admin/chat" })));
    };
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 5000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [admin]);

  const notices: Notice[] = admin
    ? [...waiting, ...arrivals]
    : chat.count > 0
      ? [{ id: "chat", title: chat.count > 1 ? `Support replied (${chat.count})` : "Support replied", body: chat.latest }]
      : [];
  const count = admin ? waiting.length + arrivals.length : chat.count;

  return (
    <Popover
      label={count ? `Notifications, ${count} new` : "Notifications"}
      buttonClass={iconBtn}
      button={
        <>
          <Bell className="size-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground ring-2 ring-card">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </>
      }
    >
      {(close) => (
        <div>
          <p className="px-2 pb-2 text-lg font-bold">Notifications</p>
          {notices.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            <ul>
              {notices.map((n) => {
                const content = (
                  <>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <MessageCircle className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{n.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                    </span>
                  </>
                );
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link href={n.href} onClick={close} className={row}>{content}</Link>
                    ) : (
                      <button onClick={() => { close(); openChat(); }} className={row}>{content}</button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Popover>
  );
}

/* ---------- Account menu with Appearance ---------- */

const chip = (active: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
    active ? "border-primary bg-primary/15 text-primary" : "border-transparent bg-secondary hover:border-primary/40"
  }`;

function SoundToggle() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    queueMicrotask(() => setOn(isSoundOn()));
  }, []);
  return (
    <button
      onClick={() => {
        const next = !on;
        setOn(next);
        setSoundOn(next);
        if (next) playChime(true); // preview
      }}
      aria-pressed={on}
      className={row + " justify-between"}
    >
      <span className="flex items-center gap-3">
        {on ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />} Notification sound
      </span>
      <span className={`text-xs font-bold ${on ? "text-primary" : "text-muted-foreground"}`}>{on ? "On" : "Off"}</span>
    </button>
  );
}

function Appearance() {
  const [open, setOpen] = useState(true);
  const [theme, setTheme] = useState<ThemeId>("light");
  const [text, setText] = useState<TextSizeId>("md");
  const [other, setOther] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const a = readAppearance();
      setTheme(a.theme);
      setText(a.text);
      setOther(a.theme === "black" || a.theme === "reading");
    });
  }, []);

  const pick = (id: ThemeId) => { setTheme(id); applyTheme(id); };
  const isOther = theme === "black" || theme === "reading";

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className={row + " justify-between"}>
        <span className="flex items-center gap-3"><Sun className="size-4" /> Appearance</span>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="ml-3 mt-1 border-l-2 pl-4 pb-2">
          <p className="mb-2 mt-1 text-xs font-bold tracking-wide text-muted-foreground">COLOR THEME</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => pick("light")} className={chip(theme === "light")}>Light</button>
            <button onClick={() => pick("dark")} className={chip(theme === "dark")}>Dark</button>
            <button onClick={() => setOther((o) => !o)} aria-expanded={other} className={chip(isOther)}>Other</button>
          </div>
          {(other || isOther) && (
            <div className="mt-2 flex flex-wrap gap-2 animate-in fade-in duration-150">
              {THEMES.filter((t) => t.id === "black" || t.id === "reading").map((t) => (
                <button key={t.id} onClick={() => pick(t.id)} className={chip(theme === t.id)}>{t.label}</button>
              ))}
            </div>
          )}

          <p className="mb-2 mt-4 text-xs font-bold tracking-wide text-muted-foreground">TEXT SIZE</p>
          <div className="flex gap-2">
            {TEXT_SIZES.map((s) => (
              <button
                key={s.id}
                onClick={() => { setText(s.id); applyTextSize(s.id); }}
                aria-label={s.label}
                aria-pressed={text === s.id}
                className={`grid size-11 place-items-center rounded-full border font-semibold transition-colors ${
                  text === s.id ? "border-primary bg-primary/15 text-primary" : "border-transparent bg-secondary hover:border-primary/40"
                }`}
                style={{ fontSize: s.px - 2 }}
              >
                A
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountMenu({ admin }: { admin: boolean }) {
  return (
    <Popover
      label="Account menu"
      buttonClass="rounded-full p-0.5 hover:bg-secondary"
      button={
        <span
          className={`grid size-10 place-items-center rounded-full text-sm font-bold ring-2 ${
            admin ? "bg-ink text-white ring-emerald-500" : "bg-secondary text-foreground ring-border"
          }`}
        >
          {admin ? "A" : <User className="size-5" />}
        </span>
      }
    >
      {(close) => (
        <div onClick={(e) => { if ((e.target as HTMLElement).closest("a")) close(); }}>
          <div className="flex items-center gap-3 px-2 pb-3 pt-1">
            <span
              className={`grid size-11 place-items-center rounded-full font-bold ring-2 ${
                admin ? "bg-ink text-white ring-emerald-500" : "bg-secondary ring-border"
              }`}
            >
              {admin ? "A" : <User className="size-5" />}
            </span>
            <div>
              <p className="font-bold">{admin ? "Admin" : "Welcome"}</p>
              <p className="text-xs text-muted-foreground">{admin ? "Signed in" : "Browse and join events"}</p>
            </div>
          </div>
          <div className="border-t pt-2">
            <Link href="/events" className={row}><CalendarDays className="size-4" /> Events</Link>
            <button onClick={() => { close(); openChat(); }} className={row}>
              <MessageCircle className="size-4" /> Support chat
            </button>
            {admin && (
              <>
                <Link href="/admin" className={row}><LayoutDashboard className="size-4" /> Dashboard</Link>
                <Link href="/admin/chat" className={row}><MessagesSquare className="size-4" /> Support inbox</Link>
              </>
            )}
          </div>
          <div className="mt-2 border-t pt-2">
            <SoundToggle />
            <Appearance />
          </div>
          <div className="mt-2 border-t pt-2">
            <Link href="/info/contact" className={row}><CircleHelp className="size-4" /> Help / Contact</Link>
            {admin && (
              <form action={logout}>
                <button className={row}><LogOut className="size-4" /> Sign out</button>
              </form>
            )}
          </div>
        </div>
      )}
    </Popover>
  );
}

export function HeaderActions({ admin }: { admin: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <CrownMenu />
      <Notifications admin={admin} />
      <AccountMenu admin={admin} />
    </div>
  );
}

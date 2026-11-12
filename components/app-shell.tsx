"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Crown,
  Home,
  Heart,
  Mail,
  Users,
  Video,
  Menu,
  X,
} from "lucide-react";
import { NavMenus } from "./nav-menu";
import { NavLink } from "./nav-link";
import { ThemeSwitcher } from "./theme-switcher";
import { OpenChatItem, SideLink, SideStatic } from "./side-item";

const get = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const set = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

function Logo() {
  return (
    <Link
      href="/"
      className="rounded-full border bg-background px-3 py-1.5 text-base font-extrabold tracking-tight sm:px-4 sm:text-lg">
      Adult<span className="text-primary">Friend</span>Finder
    </Link>
  );
}

function PromoBanner() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      if (get("promo_dismissed") === "1") setHidden(true);
    });
  }, []);
  if (hidden) return null;
  return (
    <div className="relative bg-gradient-to-r from-[#f7aa14] to-[#fbc95a] text-[#1e120f]">
      <Link
        href="/events"
        className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-12 py-3 text-sm font-bold sm:text-base">
        <Crown className="size-4 shrink-0" />
        <span className="truncate">Join our exclusive private events</span>
        <ArrowRight className="size-4 shrink-0" />
      </Link>
      <button
        onClick={() => {
          set("promo_dismissed", "1");
          setHidden(true);
        }}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 hover:bg-black/10">
        <X className="size-5" />
      </button>
    </div>
  );
}

const tab = (active: boolean) =>
  `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`;

export function AppShell({
  children,
  adminTop,
  adminSide,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  adminTop: React.ReactNode;
  adminSide: React.ReactNode;
}) {
  const [sideOpen, setSideOpen] = useState(true); // desktop only: sidebar visible

  useEffect(() => {
    queueMicrotask(() => {
      if (get("sidebar") === "closed") setSideOpen(false);
    });
  }, []);

  function toggle() {
    const next = !sideOpen;
    setSideOpen(next);
    set("sidebar", next ? "open" : "closed");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-[var(--header,var(--card))]/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggle}
              aria-label="Toggle sidebar"
              className="hidden size-10 place-items-center rounded-full hover:bg-secondary lg:grid">
              <Menu className="size-6" />
            </button>
            <Logo />
            <div className="hidden lg:block">
              <ThemeSwitcher />
            </div>
          </div>

          <NavMenus />

          <div className="flex items-center gap-2">{adminTop}</div>
        </div>
      </header>

      <PromoBanner />

      <div className="flex flex-1">
        <aside
          className={`hidden ${sideOpen ? "lg:flex" : "lg:hidden"} w-72 flex-col gap-1 overflow-y-auto border-r bg-sidebar p-4 text-sidebar-foreground lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:shrink-0`}>
          <SideLink href="/" icon="home" label="Home" />
          <SideLink href="/events" icon="events" label="Events" />
          <OpenChatItem />
          <SideStatic icon="viewed" label="Viewed me" />
          <SideStatic icon="connections" label="Connections" />
          <SideStatic icon="groups" label="Groups" />
          <SideStatic icon="games" label="Games" />
          <SideStatic icon="favorites" label="My favorites" />
          <SideStatic icon="history" label="History" />
          <div className="my-2 border-t border-sidebar-border" />
          <SideStatic icon="friends" label="Friends" />
          {adminSide}

          <div className="mt-auto rounded-2xl border bg-card p-4">
            <p className="font-bold">Private events</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Browse exclusive gatherings</li>
              <li>• See price and details first</li>
              <li>• Register in seconds</li>
            </ul>
            <Link
              href="/events"
              className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
              Browse events <ArrowRight className="size-4" />
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>

      {/* Full-width footer below the sidebar/content row, so the sticky sidebar ends where it begins. */}
      <div className="pb-16 lg:pb-0">{footer}</div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card lg:hidden"
        aria-label="Primary">
        <NavLink href="/events" className={tab}>
          <Heart className="size-6" />
          Browse
        </NavLink>
        <button
          onClick={() => window.dispatchEvent(new Event("open-support-chat"))}
          className={tab(false)}>
          <Mail className="size-6" />
          Messages
        </button>
        <Link href="/events" className={tab(false)}>
          <Video className="size-6" />
          Live
        </Link>
        <Link href="/events" className={tab(false)}>
          <Users className="size-6" />
          Community
        </Link>
        <NavLink href="/" className={tab}>
          <Home className="size-6" />
          Home
        </NavLink>
      </nav>
    </>
  );
}

"use client";

import Link from "next/link";
import {
  Asterisk,
  CalendarDays,
  Clock,
  Eye,
  Heart,
  Mail,
  Pause,
  Users,
  UsersRound,
  Home,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
} from "lucide-react";
import { NavLink } from "./nav-link";
import { logout } from "@/app/admin/actions";

const cls = (active: boolean) =>
  `group flex items-center gap-3 rounded-xl px-2 py-2 text-[15px] font-semibold transition-colors ${
    active ? "text-primary" : "text-foreground hover:text-primary"
  }`;

const circle = (active: boolean) =>
  `grid size-10 shrink-0 place-items-center rounded-full transition-colors ${
    active
      ? "bg-primary/15 text-primary"
      : "bg-background text-muted-foreground group-hover:text-primary"
  }`;

type IconProps = { className?: string };
const ICONS: Record<string, React.ComponentType<IconProps>> = {
  home: Home,
  events: CalendarDays,
  dashboard: LayoutDashboard,
  inbox: MessagesSquare,
  messages: Mail,
  viewed: Eye,
  connections: Asterisk,
  groups: UsersRound,
  games: Pause,
  favorites: Heart,
  history: Clock,
  friends: Users,
};

export function SideLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: keyof typeof ICONS;
  label: string;
}) {
  const Icon = ICONS[icon];
  return (
    <NavLink href={href} className={cls}>
      <span className={circle(false)}>
        <Icon className="size-5" />
      </span>
      {label}
    </NavLink>
  );
}

/** Plain sidebar entry that goes to /events (never shown as "current page"). */
export function SideStatic({
  icon,
  label,
}: {
  icon: keyof typeof ICONS;
  label: string;
}) {
  const Icon = ICONS[icon];
  return (
    <Link href="/events" className={cls(false)}>
      <span className={circle(false)}>
        <Icon className="size-5" />
      </span>
      {label}
    </Link>
  );
}

export function OpenChatItem() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-support-chat"))}
      className={cls(false) + " w-full text-left"}>
      <span className={circle(false)}>
        <Mail className="size-5" />
      </span>
      Messages
    </button>
  );
}

export function SidebarAdmin({ admin }: { admin: boolean }) {
  if (!admin) return null;
  return (
    <>
      <div className="my-2 border-t border-sidebar-border" />
      <SideLink href="/admin" icon="dashboard" label="Dashboard" />
      <SideLink href="/admin/chat" icon="inbox" label="Support inbox" />
      <form action={logout}>
        <button className={cls(false) + " w-full text-left"}>
          <span className={circle(false)}>
            <LogOut className="size-5" />
          </span>
          Sign out
        </button>
      </form>
    </>
  );
}

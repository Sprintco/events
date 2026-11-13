"use client";

import { CalendarCheck } from "lucide-react";

/** "Reservation" always opens the support chat, where the admin takes the booking. */
export function ReserveButton({
  label = "Reservation",
  className = "",
  variant = "solid",
}: {
  label?: string;
  className?: string;
  variant?: "solid" | "outline";
}) {
  const look =
    variant === "solid"
      ? "bg-primary text-primary-foreground hover:opacity-90"
      : "border border-white/40 text-white hover:bg-white/10";
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-support-chat"))}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wider transition ${look} ${className}`}>
      <CalendarCheck className="size-4" />
      {label}
    </button>
  );
}

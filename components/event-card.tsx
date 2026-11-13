import Link from "next/link";
import Image from "next/image";
import { Flame, Lock, MapPin } from "lucide-react";
import { type EventRow, formatPrice } from "@/lib/db";

const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const timeFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

/** Image-led card: the photo carries the card, details sit on a dark fade at the bottom. */
export function EventCard({ e, badge }: { e: EventRow; badge?: string }) {
  const d = new Date(e.starts_at);
  return (
    <Link
      href={`/events/${e.slug}`}
      className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl bg-ink text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      {e.cover_url ? (
        <Image
          src={e.cover_url}
          alt=""
          fill
          unoptimized
          sizes="(min-width:1280px) 25vw, (min-width:640px) 45vw, 100vw"
          className="-z-10 object-cover transition duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_0%,#b10f32,transparent_60%)]" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
        <div className="flex flex-col items-center rounded-2xl bg-white/90 px-3 py-1.5 text-center leading-none text-[#1e120f] backdrop-blur">
          <span className="text-[10px] font-bold uppercase tracking-widest">{monthFmt.format(d)}</span>
          <span className="font-display text-xl font-bold">{d.getUTCDate()}</span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {e.is_private && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium backdrop-blur">
              <Lock className="size-3" /> Private
            </span>
          )}
          {badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold">
              <Flame className="size-3" /> {badge}
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{timeFmt.format(d)}</p>
        <h3 className="mt-1 font-display text-2xl font-bold leading-tight">{e.title}</h3>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-white/75">
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">{e.location || "Location to be announced"}</span>
          </span>
          <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
            {formatPrice(e.price_usd)}
          </span>
        </div>
      </div>
    </Link>
  );
}

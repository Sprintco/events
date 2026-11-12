import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Flame, MapPin, Lock } from "lucide-react";
import { type EventRow, formatDate, formatPrice } from "@/lib/db";

export function EventCard({ e, badge }: { e: EventRow; badge?: string }) {
  return (
    <Link
      href={`/events/${e.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative flex h-40 items-end overflow-hidden bg-ink p-4">
        {e.cover_url ? (
          <>
            <Image src={e.cover_url} alt="" fill unoptimized sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,#b10f32,transparent_60%)]" />
        )}
        <span className="relative rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
          {formatPrice(e.price_usd)}
        </span>
        {badge && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white">
            <Flame className="size-3" /> {badge}
          </span>
        )}
        {e.is_private && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white">
            <Lock className="size-3" /> Private
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold leading-snug group-hover:text-primary">{e.title}</h3>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" /> {formatDate(e.starts_at)}
        </p>
        {e.location && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" /> {e.location}
          </p>
        )}
      </div>
    </Link>
  );
}

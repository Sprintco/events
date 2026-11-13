"use client";

import { useEffect } from "react";

/** Counts one view per browser session for this event (feeds the Trending lists). */
export function ViewPing({ eventId }: { eventId: number }) {
  useEffect(() => {
    const key = `viewed_${eventId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* count it anyway */
    }
    fetch("/api/events/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId }),
      keepalive: true,
    }).catch(() => {});
  }, [eventId]);
  return null;
}

"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Keeps a scrollable chat container pinned to the newest message, but only while the user is
 * already near the bottom, so scrolling up to read history is never interrupted.
 * It scrolls the container itself (never the page).
 *
 * `trigger` should change only when something worth scrolling for happens
 * (new message count, typing bubble appears, conversation switched, widget opened).
 */
export function useStickToBottom(trigger: string) {
  const ref = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  /** Force the next update to scroll down (e.g. after the user sends a message). */
  const pin = useCallback(() => {
    stick.current = true;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [trigger]);

  return { ref, onScroll, pin };
}

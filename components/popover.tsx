"use client";

import { useEffect, useRef, useState } from "react";

// Full-width sheet under the header on phones, anchored dropdown from sm up.
export const POPOVER_PANEL =
  "fixed inset-x-3 top-[4.25rem] z-50 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border bg-card p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80";

export function Popover({
  button,
  buttonClass,
  label,
  panelClass = POPOVER_PANEL,
  children,
}: {
  button: React.ReactNode;
  buttonClass: string;
  label: string;
  panelClass?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

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
    <div ref={box} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label={label} aria-expanded={open} className={buttonClass}>
        {button}
      </button>
      {open && <div className={panelClass}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

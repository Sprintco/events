"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { THEMES, applyTheme, isTheme, type ThemeId } from "@/lib/theme";

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>("light");
  const box = useRef<HTMLDivElement>(null);

  // The inline script in <head> already applied the theme; read it back after hydration.
  useEffect(() => {
    queueMicrotask(() => {
      const t = document.documentElement.dataset.theme ?? null;
      if (isTheme(t)) setTheme(t);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(id: ThemeId) {
    setTheme(id);
    applyTheme(id);
    setOpen(false);
  }

  const dark = theme === "dark" || theme === "black";

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border bg-card p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((t) => {
              const active = t.id === theme;
              return (
                <button
                  key={t.id}
                  onClick={() => choose(t.id)}
                  aria-pressed={active}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span
                    className="grid size-10 grid-cols-2 grid-rows-2 overflow-hidden rounded-lg border border-black/10"
                    aria-hidden
                  >
                    <span className="col-span-2" style={{ background: t.top }} />
                    <span style={{ background: t.left }} />
                    <span style={{ background: t.right }} />
                  </span>
                  {t.label}
                  {active && <Check className="absolute right-2 top-2 size-4" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

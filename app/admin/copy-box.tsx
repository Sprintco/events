"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Shows secret text once, with a copy button. Used for one-time passwords and recovery codes. */
export function CopyBox({ title, lines, note }: { title: string; lines: string[]; note?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="rounded-2xl border border-accent bg-accent/10 p-4">
      <div className="flex items-center gap-2">
        <p className="mr-auto font-semibold">{title}</p>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(lines.join("\n"));
              setDone(true);
              setTimeout(() => setDone(false), 2000);
            } catch {
              /* clipboard blocked: the text is selectable */
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold">
          {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {done ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-3 select-all whitespace-pre-wrap break-all rounded-xl bg-background p-3 font-mono text-sm">{lines.join("\n")}</pre>
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

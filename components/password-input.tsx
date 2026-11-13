"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const base =
  "w-full rounded-xl border bg-background py-2.5 pl-4 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/** Password field with an eye button to show or hide what was typed. */
export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const { className, ...rest } = props;
  return (
    <div className="relative">
      <input {...rest} type={show ? "text" : "password"} className={className ?? base} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

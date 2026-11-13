"use client";

import { deleteEvent } from "./actions";

/** Delete button that asks first, so a stray tap on a phone cannot remove an event. */
export function ConfirmDelete({ id, title }: { id: number; title: string }) {
  return (
    <form
      action={deleteEvent}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) e.preventDefault();
      }}>
      <input type="hidden" name="id" value={id} />
      <button className="rounded-full border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10">
        Delete
      </button>
    </form>
  );
}

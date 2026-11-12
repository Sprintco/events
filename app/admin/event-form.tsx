"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, X } from "lucide-react";
import { createEvent, updateEvent } from "./actions";

const input =
  "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export type EditableEvent = {
  id: number;
  title: string;
  description: string;
  location: string;
  startsAt: string; // value for <input type="datetime-local">
  price: number;
  isPrivate: boolean;
  coverUrl: string | null;
};

type FormState = { error?: string; ok?: boolean };

/** Creates an event, or edits one when `event` is passed. */
export function EventForm({ event }: { event?: EditableEvent }) {
  const editing = !!event;
  const [state, action, pending] = useActionState<FormState, FormData>(editing ? updateEvent : createEvent, {});
  const ref = useRef<HTMLFormElement>(null);
  const [cover, setCover] = useState<string | null>(event?.coverUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok && !editing) {
      ref.current?.reset();
      queueMicrotask(() => { setCover(null); setUploadMsg(null); });
    }
  }, [state, editing]);

  const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setCover(data.url);
      setUploadMsg(`Compressed ${kb(data.originalBytes)} → ${kb(data.storedBytes)}`);
    } catch (err) {
      setUploadMsg(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form ref={ref} action={action} className="space-y-3 rounded-2xl border bg-card p-6">
      <h2 className="text-lg font-semibold">{editing ? "Edit event" : "Create event"}</h2>
      {event && <input type="hidden" name="id" value={event.id} />}
      <input type="hidden" name="coverUrl" value={cover ?? ""} />
      {cover ? (
        <div className="relative aspect-[16/7] overflow-hidden rounded-xl bg-secondary">
          <Image src={cover} alt="Cover preview" fill unoptimized className="object-cover" />
          <button
            type="button"
            onClick={() => { setCover(null); setUploadMsg(null); }}
            aria-label="Remove cover image"
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed py-6 text-sm text-muted-foreground hover:border-primary hover:text-primary">
          <ImagePlus className="size-6" />
          {uploading ? "Uploading…" : "Add cover image"}
          <input type="file" accept="image/*" onChange={onPick} disabled={uploading} className="hidden" />
        </label>
      )}
      {uploadMsg && <p className="text-xs text-muted-foreground">{uploadMsg}</p>}
      <input name="title" placeholder="Event title" required maxLength={150} defaultValue={event?.title} className={input} />
      <textarea
        name="description"
        placeholder="Description"
        rows={4}
        maxLength={5000}
        defaultValue={event?.description}
        className={input}
      />
      <input
        name="location"
        placeholder="Location (or online link)"
        maxLength={200}
        defaultValue={event?.location}
        className={input}
      />
      <div className="grid grid-cols-2 gap-3">
        <input name="startsAt" type="datetime-local" required defaultValue={event?.startsAt} className={input} />
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          defaultValue={event?.price ?? 0}
          placeholder="Price (USD)"
          className={input}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPrivate"
          defaultChecked={event?.isPrivate ?? true}
          className="size-4 accent-[#b10f32]"
        />
        Private event
      </label>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && !editing && <p className="text-sm text-primary">Event created.</p>}
      <div className="flex gap-2">
        {editing && (
          <Link
            href="/admin"
            className="grid place-items-center rounded-full border px-5 py-3 text-sm font-semibold hover:bg-secondary"
          >
            Cancel
          </Link>
        )}
        <button
          disabled={pending || uploading}
          className="flex-1 rounded-full bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {editing ? (pending ? "Saving…" : "Save changes") : pending ? "Creating…" : "Create event"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStickToBottom } from "@/lib/use-stick-to-bottom";

type Conv = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  closed_at: string | null;
  online: boolean;
  last_body: string | null;
  last_sender: string | null;
  last_at: string | null;
};
type Msg = { id: number; sender: "visitor" | "admin"; body: string; read_at: string | null };
type Visitor = { id: string; path: string; name: string | null };

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function ago(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

export function Inbox() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [online, setOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const activeConv = convs.find((c) => c.id === active);
  const { ref: scrollRef, onScroll, pin } = useStickToBottom(`${active}:${messages.length}:${visitorTyping}`);
  const lastPing = useRef(0);

  const loadConvs = useCallback(async () => {
    const r = await fetch("/api/chat/admin", { cache: "no-store" }).catch(() => null);
    if (!r?.ok) return;
    const data = await r.json();
    setConvs(data.conversations);
    setVisitors(data.visitors ?? []);
  }, []);

  const loadMsgs = useCallback(async () => {
    if (!active) return;
    const r = await fetch(`/api/chat/admin?id=${active}`, { cache: "no-store" }).catch(() => null);
    if (!r?.ok) return;
    const data = await r.json();
    setMessages(data.messages);
    setVisitorTyping(!!data.visitorTyping);
    setOnline(!!data.online);
    setLastSeen(data.lastSeen ?? null);
  }, [active]);

  useEffect(() => {
    const first = setTimeout(loadConvs, 0);
    const t = setInterval(loadConvs, 5000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [loadConvs]);

  useEffect(() => {
    const first = setTimeout(loadMsgs, 0);
    const t = setInterval(loadMsgs, 2000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [loadMsgs]);

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !active) return;
    pin();
    setText("");
    await fetch("/api/chat/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: active, body }),
    });
    loadMsgs();
    loadConvs();
  }

  const lastAdminId = Math.max(0, ...messages.filter((m) => m.sender === "admin").map((m) => m.id));

  return (
    <>
    <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 font-semibold">
        <span className={`size-2 rounded-full ${visitors.length ? "bg-green-500" : "bg-muted-foreground/40"}`} />
        {visitors.length} online now
      </span>
      {visitors.map((v) => (
        <span key={v.id} className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{v.name ?? "Visitor"}</span> · {v.path}
        </span>
      ))}
    </div>
    <div className="mt-3 grid h-[34rem] overflow-hidden rounded-2xl border bg-card md:grid-cols-[300px_1fr]">
      <ul className="overflow-y-auto border-r">
        {convs.length === 0 && <li className="p-4 text-sm text-muted-foreground">No conversations yet.</li>}
        {convs.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => { pin(); setMessages([]); setVisitorTyping(false); setOnline(false); setLastSeen(null); setActive(c.id); }}
              className={`w-full border-b px-4 py-3 text-left hover:bg-secondary ${active === c.id ? "bg-secondary" : ""}`}
            >
              <p className="flex items-center gap-2 font-medium">
                {c.name}
                {c.online && !c.closed_at && <span className="size-2 rounded-full bg-green-500" title="Online" />}
                {c.closed_at ? (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">Closed</span>
                ) : (
                  c.last_sender === "visitor" && <span className="size-2 rounded-full bg-accent" title="Awaiting reply" />
                )}
              </p>
              <p className="truncate text-sm text-muted-foreground">{c.last_body}</p>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex min-h-0 flex-col">
        {!active ? (
          <p className="m-auto text-sm text-muted-foreground">Select a conversation</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2 text-sm">
              <span className="font-semibold">{activeConv?.name}</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`size-2 rounded-full ${online ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                {online ? "Online" : lastSeen ? `Last seen ${ago(lastSeen)}` : "Offline"}
              </span>
              {activeConv?.email && (
                <a href={`mailto:${activeConv.email}`} className="truncate text-primary hover:underline">
                  {activeConv.email}
                </a>
              )}
              {activeConv?.phone && (
                <a href={`tel:${activeConv.phone}`} className="shrink-0 text-primary hover:underline">
                  {activeConv.phone}
                </a>
              )}
            </div>
            <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => (
                <div key={m.id} className={m.sender === "admin" ? "flex flex-col items-end" : ""}>
                  <div
                    className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                      m.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    {m.body}
                  </div>
                  {m.id === lastAdminId && (
                    <span className="mt-0.5 px-1 text-[11px] text-muted-foreground">
                      {m.read_at ? `Seen ${clock(m.read_at)}` : "Sent"}
                    </span>
                  )}
                </div>
              ))}
              {visitorTyping && (
                <div
                  className="flex w-fit items-center gap-1 rounded-2xl bg-secondary px-4 py-3"
                  role="status"
                  aria-label="Visitor is typing"
                >
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>
            {activeConv?.closed_at ? (
              <p className="border-t bg-secondary p-3 text-center text-sm text-muted-foreground">
                The visitor ended this chat. If they message again it will start as a new conversation.
              </p>
            ) : (
            <form onSubmit={reply} className="flex gap-2 border-t p-3">
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  // let the visitor know we're typing (at most once every 2s)
                  if (e.target.value && Date.now() - lastPing.current > 2000) {
                    lastPing.current = Date.now();
                    fetch("/api/chat/admin/typing", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: active }),
                    }).catch(() => null);
                  }
                }}
                maxLength={1000}
                placeholder="Write a reply…"
                className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
              />
              <button className="rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Send</button>
            </form>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}

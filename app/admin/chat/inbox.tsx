"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { pageName } from "@/lib/page-name";
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
type Visitor = { id: string; path: string; name: string | null; page_title?: string | null };

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function ago(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

const initials = (n: string) =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

function Avatar({ name, online }: { name: string; online?: boolean }) {
  return (
    <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
      {initials(name)}
      {online && <span className="absolute -bottom-0 -right-0 size-3 rounded-full border-2 border-card bg-green-500" />}
    </span>
  );
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
  const waiting = convs.filter((c) => !c.closed_at && c.last_sender === "visitor").length;
  const who = activeConv?.name ?? "Visitor";

  return (
    <>
      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 text-sm [scrollbar-width:none]">
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border bg-card px-3 py-1.5 font-semibold">
          <span className={`size-2 rounded-full ${visitors.length ? "bg-green-500" : "bg-muted-foreground/40"}`} />
          {visitors.length} online now
        </span>
        {waiting > 0 && (
          <span className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">
            {waiting} waiting for a reply
          </span>
        )}
        {visitors.map((v) => (
          <span key={v.id} className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{v.name ?? "Visitor"}</span> · {pageName(v.path, v.page_title)}
          </span>
        ))}
      </div>

      {/* Phones show one panel at a time (list, then the open chat). From md up both sit side by side. */}
      <div className="mt-3 grid h-[calc(100dvh-17rem)] min-h-[26rem] overflow-hidden rounded-2xl border bg-card md:h-[34rem] md:grid-cols-[320px_1fr]">
        <ul className={`overflow-y-auto border-r ${active ? "hidden md:block" : ""}`}>
          {convs.length === 0 && <li className="p-4 text-sm text-muted-foreground">No conversations yet.</li>}
          {convs.map((c) => {
            const needsReply = !c.closed_at && c.last_sender === "visitor";
            return (
              <li key={c.id}>
                <button
                  onClick={() => { pin(); setMessages([]); setVisitorTyping(false); setOnline(false); setLastSeen(null); setActive(c.id); }}
                  className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left hover:bg-secondary ${active === c.id ? "bg-secondary" : ""}`}>
                  <Avatar name={c.name} online={c.online && !c.closed_at} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate ${needsReply ? "font-bold" : "font-medium"}`}>{c.name}</span>
                      {c.last_at && <span className="shrink-0 text-[11px] text-muted-foreground">{ago(c.last_at)}</span>}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-sm text-muted-foreground">
                        {c.last_sender === "admin" ? "You: " : ""}{c.last_body}
                      </span>
                      {c.closed_at ? (
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Closed</span>
                      ) : needsReply ? (
                        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">Reply</span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className={`min-h-0 flex-col ${active ? "flex" : "hidden md:flex"}`}>
          {!active ? (
            <p className="m-auto text-sm text-muted-foreground">Select a conversation</p>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b px-3 py-2.5">
                <button
                  onClick={() => setActive(null)}
                  aria-label="Back to conversations"
                  className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-secondary md:hidden">
                  <ArrowLeft className="size-5" />
                </button>
                <Avatar name={who} online={online} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-tight">{who}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {online ? "Online now" : lastSeen ? `Last seen ${ago(lastSeen)}` : "Offline"}
                    {activeConv?.email && <> · <a href={`mailto:${activeConv.email}`} className="text-primary hover:underline">{activeConv.email}</a></>}
                  </p>
                </div>
                {activeConv?.phone && (
                  <a href={`tel:${activeConv.phone}`} className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold text-primary">
                    Call
                  </a>
                )}
              </div>

              <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={m.sender === "admin" ? "flex flex-col items-end" : "flex flex-col items-start"}>
                    <span className="mb-0.5 px-1 text-[11px] font-medium text-muted-foreground">
                      {m.sender === "admin" ? "You" : who}
                    </span>
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                        m.sender === "admin"
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-secondary"
                      }`}>
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
                  <div className="flex flex-col items-start" role="status" aria-label={`${who} is typing`}>
                    <span className="mb-0.5 px-1 text-[11px] font-medium text-muted-foreground">{who} is typing</span>
                    <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {activeConv?.closed_at ? (
                <p className="border-t bg-secondary p-3 text-center text-sm text-muted-foreground">
                  {who} ended this chat. If they message again it will start as a new conversation.
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
                    placeholder={`Reply to ${who}…`}
                    className="min-w-0 flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
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

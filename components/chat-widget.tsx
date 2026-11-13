"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";
import { setChatUnread } from "@/lib/chat-events";
import { useStickToBottom } from "@/lib/use-stick-to-bottom";
import { playChime, unlockAudio } from "@/lib/sound";

type Msg = { id: number; sender: "visitor" | "admin"; body: string };

const safeGet = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};
const QUICK_REPLY = "Yes, I'd like to book a private event";

const phoneOk = (v: string) => {
  const digits = v.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const safeRemove = (k: string) => {
  try {
    localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
};

function getVisitorId() {
  let id = safeGet("visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    safeSet("visitor_id", id);
  }
  return id;
}

function getChatId() {
  let id = safeGet("chat_id");
  if (!id) {
    id = crypto.randomUUID();
    safeSet("chat_id", id);
  }
  return id;
}

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [botReady, setBotReady] = useState(false); // automated greeting has "arrived"
  const [teaserReady, setTeaserReady] = useState(false); // proactive "contact support" bubble
  const [teaserDismissed, setTeaserDismissed] = useState(false);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false); // support is typing a reply
  const [seen, setSeen] = useState(0); // id of the newest admin message the visitor has read
  const [dismissed, setDismissed] = useState(0); // newest admin message whose popup was closed
  const lastPing = useRef(0);
  const openRef = useRef(false);
  const [ended, setEnded] = useState(false); // the visitor ended the chat; next message starts a new one
  const [confirmEnd, setConfirmEnd] = useState(false);
  const endedRef = useRef(false);
  const knownAdminId = useRef<number | null>(null); // newest support message already known (for the chime)

  const markSeen = useCallback((list: Msg[]) => {
    const newest = Math.max(
      0,
      ...list.filter((m) => m.sender === "admin").map((m) => m.id),
    );
    setSeen((prev) => {
      const next = Math.max(prev, newest);
      if (next !== prev) safeSet("chat_seen", String(next));
      return next;
    });
  }, []);

  // Restore the visitor's details after hydration (localStorage is client-only).
  useEffect(() => {
    queueMicrotask(() => {
      const n = safeGet("chat_name");
      const em = safeGet("chat_email");
      const ph = safeGet("chat_phone");
      if (n) setName(n);
      if (em) setEmail(em);
      if (ph) setPhone(ph);
      if (n && em && ph) setStarted(true);
      setSeen(Number(safeGet("chat_seen")) || 0);
      try {
        if (sessionStorage.getItem("chat_teaser_dismissed") === "1")
          setTeaserDismissed(true);
      } catch {
        /* ignore */
      }
    });
  }, []);

  useEffect(() => {
    unlockAudio();
  }, []);

  // Presence: tell support this visitor is on the site (and which page) while the tab is in view.
  useEffect(() => {
    const beat = () => {
      if (document.hidden) return;
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vid: getVisitorId(),
          path: pathname,
          chat: safeGet("chat_id"),
        }),
        keepalive: true,
      }).catch(() => null);
    };
    const first = setTimeout(beat, 0);
    const t = setInterval(beat, 20000);
    document.addEventListener("visibilitychange", beat);
    return () => {
      clearTimeout(first);
      clearInterval(t);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [pathname]);

  // A moment after the page opens, nudge visitors with a message from the chat button.
  useEffect(() => {
    const t = setTimeout(() => setTeaserReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Automated greeting "types" for a moment, then appears.
  useEffect(() => {
    if (!open || !started || ended || botReady) return;
    const t = setTimeout(() => setBotReady(true), 900);
    return () => clearTimeout(t);
  }, [open, started, ended, botReady]);

  // Forget this conversation locally; the next message gets a brand-new id (new session).
  const finishEnd = useCallback(() => {
    endedRef.current = true;
    knownAdminId.current = null;
    safeRemove("chat_id");
    safeRemove("chat_seen");
    setMessages([]);
    setSeen(0);
    setDismissed(0);
    setTyping(false);
    setConfirmEnd(false);
    setText("");
    setBotReady(false);
    setEnded(true);
  }, []);

  const load = useCallback(async () => {
    if (endedRef.current) return;
    const r = await fetch(`/api/chat?id=${getChatId()}&open=${openRef.current && !document.hidden ? 1 : 0}`, {
      cache: "no-store",
    }).catch(() => null);
    if (!r?.ok || endedRef.current) return;
    const data = await r.json();
    if (data.closed) {
      finishEnd();
      return;
    } // closed from another tab
    const list: Msg[] = data.messages;

    // Chime when a NEW support reply arrives while the chat is closed or the tab is in the background.
    const newestAdmin = Math.max(
      0,
      ...list.filter((m) => m.sender === "admin").map((m) => m.id),
    );
    if (knownAdminId.current === null) {
      knownAdminId.current = newestAdmin; // first load: just remember what's already there
    } else if (newestAdmin > knownAdminId.current) {
      knownAdminId.current = newestAdmin;
      if (!openRef.current || document.hidden) playChime();
    }

    setMessages(list);
    setTyping(!!data.adminTyping);
    if (openRef.current) markSeen(list);
  }, [markSeen, finishEnd]);

  // Keep polling even when the window is closed, so new replies can pop up (paused when the tab is hidden).
  useEffect(() => {
    if (!started) return;
    const tick = () => {
      if (!document.hidden) load();
    };
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, open ? 2000 : 8000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearTimeout(first);
      clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [open, started, load]);

  async function endChat() {
    const id = getChatId();
    finishEnd();
    await fetch("/api/chat/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
  }

  function startNew() {
    endedRef.current = false;
    setEnded(false);
  }

  // Lets the sidebar / mobile tab bar open the chat.
  useEffect(() => {
    const openChat = () => {
      openRef.current = true;
      setOpen(true);
    };
    window.addEventListener("open-support-chat", openChat);
    return () => window.removeEventListener("open-support-chat", openChat);
  }, []);

  function dismissTeaser() {
    setTeaserDismissed(true);
    try {
      sessionStorage.setItem("chat_teaser_dismissed", "1");
    } catch {
      /* ignore */
    }
  }

  function toggle() {
    const next = !open;
    openRef.current = next;
    setOpen(next);
    if (next) markSeen(messages);
  }

  function close() {
    openRef.current = false;
    setOpen(false);
  }

  const showTeaser = teaserReady && !teaserDismissed && !open;
  const unseen = open
    ? []
    : messages.filter((m) => m.sender === "admin" && m.id > seen);
  const latest = unseen[unseen.length - 1];

  const latestBody = latest?.body ?? "";
  useEffect(() => {
    setChatUnread({ count: unseen.length, latest: latestBody });
  }, [unseen.length, latestBody]);

  // Only follow new messages while the visitor is already at the bottom (never yank the page).
  const {
    ref: scrollRef,
    onScroll,
    pin,
  } = useStickToBottom(`${open}:${messages.length}:${typing}:${botReady}`);

  if (pathname.startsWith("/admin")) return null;

  function onType(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    // let support know we're typing (at most once every 2s)
    if (e.target.value && Date.now() - lastPing.current > 2000) {
      lastPing.current = Date.now();
      fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: getChatId() }),
      }).catch(() => null);
    }
  }

  async function sendText(raw: string) {
    const body = raw.trim();
    if (!body) return;
    const id = getChatId();
    pin();
    setText("");
    setMessages((m) => [...m, { id: Date.now(), sender: "visitor", body }]);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, email, phone, body }),
    }).catch(() => null);
    if (res?.status === 409) {
      finishEnd();
      return;
    } // that conversation was already closed
    load();
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    sendText(text);
  }

  function start(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const em = email.trim();
    const ph = phone.trim();
    if (!n) return setFormError("Please enter your name.");
    if (!EMAIL_RE.test(em))
      return setFormError("Please enter a valid email address.");
    if (!phoneOk(ph)) return setFormError("Please enter a valid phone number.");
    setFormError("");
    safeSet("chat_name", n);
    safeSet("chat_email", em);
    safeSet("chat_phone", ph);
    setName(n);
    setEmail(em);
    setPhone(ph);
    setStarted(true);
  }

  const field =
    "w-full rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="fixed bottom-20 right-4 z-50 lg:bottom-5 lg:right-5">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
          <div className="flex items-center bg-ink px-4 py-3 text-white">
            <div className="mr-auto">
              <p className="font-semibold">Support</p>
              <p className="text-xs text-white/60">
                Ask us anything about our events
              </p>
            </div>
            {started && !ended && messages.length > 0 && (
              <button
                onClick={() => setConfirmEnd(true)}
                className="mr-3 rounded-full border border-white/30 px-3 py-1 text-xs font-medium hover:bg-white/10">
                End chat
              </button>
            )}
            <button onClick={close} aria-label="Minimize chat">
              <X className="size-5" />
            </button>
          </div>

          {confirmEnd && (
            <div className="flex items-center gap-2 border-b bg-secondary px-4 py-2 text-sm">
              <span className="mr-auto">End this chat?</span>
              <button
                onClick={() => setConfirmEnd(false)}
                className="rounded-full px-3 py-1 text-xs font-medium hover:bg-background">
                Cancel
              </button>
              <button
                onClick={endChat}
                className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                End chat
              </button>
            </div>
          )}

          {ended ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="font-semibold">Chat ended</p>
              <p className="text-sm text-muted-foreground">
                Thanks for reaching out! Need anything else? Start a new chat
                any time.
              </p>
              <button
                onClick={startNew}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
                Start a new chat
              </button>
            </div>
          ) : !started ? (
            <form
              onSubmit={start}
              className="flex flex-1 flex-col justify-center gap-3 p-5"
              noValidate>
              <p className="text-base font-semibold">
                Chat with customer support
              </p>
              <p className="text-sm text-muted-foreground">
                Tell us who you are so we can reach you by email or phone if
                you&apos;re offline.
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Your name"
                autoComplete="name"
                className={field}
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                maxLength={200}
                placeholder="Your email"
                autoComplete="email"
                className={field}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                maxLength={30}
                placeholder="Your phone number"
                autoComplete="tel"
                className={field}
              />
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
              <button className="rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground">
                Start chat
              </button>
            </form>
          ) : (
            <>
              <div
                ref={scrollRef}
                onScroll={onScroll}
                className="flex-1 space-y-2 overflow-y-auto p-4">
                {botReady || messages.length > 0 ? (
                  <>
                    <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm bg-secondary px-3 py-2 text-sm">
                      {"Hello,\n\nThank you for reaching out. We’ve received your message and appreciate you getting in touch. I’m assuming you’re reaching out regarding the private party RSVP?"}
                    </div>
                    {messages.length === 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => sendText(QUICK_REPLY)}
                          className="rounded-full border border-primary/40 bg-card px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10">
                          {QUICK_REPLY}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3"
                    aria-label="Support is typing">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                      m.sender === "visitor"
                        ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-secondary"
                    }`}>
                    {m.body}
                  </div>
                ))}
                {typing && (
                  <div
                    className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3"
                    role="status"
                    aria-label="Support is typing">
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
              <form onSubmit={send} className="flex gap-2 border-t p-3">
                <input
                  value={text}
                  onChange={onType}
                  maxLength={1000}
                  placeholder="Type a message…"
                  className={field}
                />
                <button
                  aria-label="Send"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Send className="size-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
      {latest && latest.id > dismissed && (
        <div className="mb-3 ml-auto w-[min(18rem,calc(100vw-2.5rem))] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="relative rounded-2xl rounded-br-sm border bg-card p-3 pr-8 shadow-xl">
            <button
              onClick={() => setDismissed(latest.id)}
              aria-label="Dismiss"
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
            <button onClick={toggle} className="block w-full text-left">
              <p className="text-xs font-semibold text-primary">
                Support replied
              </p>
              <p className="mt-0.5 line-clamp-3 break-words text-sm">
                {latest.body}
              </p>
            </button>
          </div>
        </div>
      )}
      {showTeaser && !(latest && latest.id > dismissed) && (
        <div className="mb-3 ml-auto w-[min(18rem,calc(100vw-2.5rem))] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="relative rounded-2xl rounded-br-sm border bg-card p-3 pr-8 shadow-xl">
            <button
              onClick={dismissTeaser}
              aria-label="Dismiss"
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
            <button onClick={toggle} className="block w-full text-left">
              <p className="text-xs font-semibold text-primary">
                Customer support
              </p>
              <p className="mt-0.5 text-sm">
                Contact customer support to book your event
              </p>
            </button>
          </div>
        </div>
      )}
      <button
        onClick={toggle}
        aria-label={
          unseen.length
            ? `Open support chat, ${unseen.length} new`
            : "Open support chat"
        }
        className="relative ml-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90">
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {unseen.length > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground ring-2 ring-background">
            {unseen.length > 9 ? "9+" : unseen.length}
          </span>
        )}
      </button>
    </div>
  );
}

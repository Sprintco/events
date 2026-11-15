import { ExternalLink, MessageCircle, Users } from "lucide-react";
import { SMARTSUPP_APP_URL } from "@/lib/smartsupp/const";
import { listAgents, searchConversations, smartsuppApiConfigured } from "@/lib/smartsupp/client";

const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

const statCard = "h-full rounded-2xl border bg-card p-4";
const statLabel = "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/** Two dashboard stat cards backed by the Smartsupp API: open chats and agents online. */
export async function SmartsuppStats() {
  if (!smartsuppApiConfigured()) {
    return (
      <a href={SMARTSUPP_APP_URL} target="_blank" rel="noreferrer" className="col-span-2">
        <div className={statCard}>
          <div className={statLabel}><MessageCircle className="size-4" /> Live chat</div>
          <p className="mt-2 font-display text-xl font-bold">Open Smartsupp</p>
          <p className="mt-1 text-xs text-muted-foreground">Answer messages in the Smartsupp app.</p>
        </div>
      </a>
    );
  }
  const [convs, agents] = await Promise.all([searchConversations(["open"], 1), listAgents()]);
  const online = agents.ok ? agents.data.agents.filter((a) => a.active && a.status === "online").length : null;
  return (
    <>
      <a href={SMARTSUPP_APP_URL} target="_blank" rel="noreferrer">
        <div className={`${statCard} hover:border-primary/40`}>
          <div className={statLabel}><MessageCircle className="size-4" /> Open chats</div>
          <p className="mt-2 font-display text-3xl font-bold">{convs.ok ? convs.data.total : "-"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Waiting in Smartsupp</p>
        </div>
      </a>
      <div className={statCard}>
        <div className={statLabel}><Users className="size-4" /> Agents online</div>
        <p className="mt-2 font-display text-3xl font-bold">{online ?? "-"}</p>
        <p className="mt-1 text-xs text-muted-foreground">Signed in to Smartsupp</p>
      </div>
    </>
  );
}

/** The newest open conversations (read only), with a button to answer them in the Smartsupp app. */
export async function SmartsuppConversations({ size = 5, heading = true }: { size?: number; heading?: boolean }) {
  const configured = smartsuppApiConfigured();
  const res = configured ? await searchConversations(["open", "served"], size) : null;
  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2">
        {heading && <h2 className="mr-auto font-semibold">Smartsupp chats</h2>}
        <a
          href={SMARTSUPP_APP_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
          Answer in Smartsupp <ExternalLink className="size-3.5" />
        </a>
      </div>
      {!configured ? (
        <p className="mt-3 text-sm text-muted-foreground">
          The website chat is on. Add <code>SMARTSUPP_API_TOKEN</code> to also list conversations here.
        </p>
      ) : !res?.ok ? (
        <p className="mt-3 text-sm text-destructive">Could not load conversations: {res?.ok === false ? res.error : ""}</p>
      ) : res.data.items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No open conversations.</p>
      ) : (
        <ul className="mt-2 divide-y">
          {res.data.items.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                <MessageCircle className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">Conversation {c.id.slice(-6)}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {c.domain ?? "Website"} · {c.assigned_ids?.length ? "Assigned" : "Unassigned"}
                  {c.is_offline ? " · Sent offline" : ""}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium capitalize">{c.status}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{ago(c.updated_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

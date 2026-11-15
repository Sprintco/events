import { BASE_URLS, CONVERSATION_STATUS, URLS } from "./const";

/** True when the server has a Smartsupp API token. The website widget needs only the public chat key. */
export const smartsuppApiConfigured = () => !!process.env.SMARTSUPP_API_TOKEN && !!BASE_URLS.SMARTSUPP_API;

type Params = Record<string, string | number>;
type Options = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Values for {placeholders} in the path. */
  params?: Params;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export type SmartsuppResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

const safeJson = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

/** Calls one Smartsupp endpoint. Never throws: returns { ok, data } or { ok: false, error }. */
export async function smartsupp<T = unknown>(path: string, opts: Options = {}): Promise<SmartsuppResult<T>> {
  const base = BASE_URLS.SMARTSUPP_API;
  const token = process.env.SMARTSUPP_API_TOKEN;
  if (!base || !token) return { ok: false, status: 0, error: "Smartsupp API token is not set." };

  let url = path.replace(/\{(\w+)\}/g, (_, k: string) => encodeURIComponent(String(opts.params?.[k] ?? "")));
  const q = Object.entries(opts.query ?? {}).filter(([, v]) => v !== undefined);
  if (q.length) url += `?${new URLSearchParams(q.map(([k, v]) => [k, String(v)]))}`;

  try {
    const res = await fetch(`${base}${url}`, {
      method: opts.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opts.body !== undefined && { "Content-Type": "application/json" }),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
    const json = await safeJson(res);
    if (!res.ok) {
      const msg = (json as { message?: string; error?: string } | null)?.message ?? (json as { error?: string } | null)?.error;
      return { ok: false, status: res.status, error: msg ?? `Smartsupp returned ${res.status}` };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "Could not reach Smartsupp." };
  }
}

// ---------- Types for the fields this app reads (the API returns more) ----------

export type SsAgent = { id: string; name: string; email: string; role: string; status: string; active: boolean };
export type SsConversation = {
  id: string;
  contact_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_ids?: string[];
  is_offline?: boolean;
  domain?: string;
};
export type SsMessage = {
  id: string;
  conversation_id: string;
  created_at: string;
  sub_type: "agent" | "contact" | "bot" | string;
  content?: { text?: string | null; html?: string | null };
};
type Collection<T> = { total: number; items: T[]; after?: number[] };

// ---------- Ready-made calls ----------

export const listAgents = () => smartsupp<{ agents: SsAgent[] }>(URLS.agents.list);

/** Conversations in the given statuses, newest first. */
export const searchConversations = (
  status: (keyof typeof CONVERSATION_STATUS)[] = ["open", "served"],
  size = 20,
) =>
  smartsupp<Collection<SsConversation>>(URLS.conversations.search, {
    method: "POST",
    body: {
      timezone: "UTC",
      size,
      query: [{ field: "status", value: status }],
      sort: [{ created_at: "desc" }],
    },
  });

export const getConversationMessages = (id: string, size = 50) =>
  smartsupp<Collection<SsMessage>>(URLS.conversations.messages, { params: { id }, query: { size, sort: "asc" } });

export const replyToConversation = (id: string, agentId: string, text: string) =>
  smartsupp(URLS.conversations.messages, {
    method: "POST",
    params: { id },
    body: { type: "message", sub_type: "agent", agent_id: agentId, content: { type: "text", text } },
  });

export const closeConversation = (id: string) => smartsupp(URLS.conversations.close, { method: "PATCH", params: { id } });

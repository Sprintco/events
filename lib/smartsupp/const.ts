/*
 * Smartsupp Open API v2 (https://api.smartsupp.com/v2/swagger/open-api).
 * Every endpoint the app can call is listed here, so code never hard-codes a path.
 * Placeholders like {id} are filled in by `smartsupp()` in ./client.ts.
 */

export const BASE_URLS = {
  SMARTSUPP_API: process.env.SMARTSUPP_API_URL || "https://api.smartsupp.com/v2",
};

/** Public "Chat key" from Smartsupp (Settings > Chat box > Chat code). Needed for the website widget. */
export const SMARTSUPP_CHAT_KEY = process.env.NEXT_PUBLIC_SMARTSUPP_KEY || "";

/** Where the team signs in to answer messages (web). The mobile and desktop apps use the same login. */
export const SMARTSUPP_APP_URL = "https://dashboard.smartsupp.com";

export const URLS = {
  oauth: {
    access: "/oauth/access",
  },
  agents: {
    list: "/agents",
    get: "/agents/{id}",
    update: "/agents/{id}",
    ping: "/agents/{id}/ping",
  },
  bots: {
    trigger: "/bots/{id}/trigger",
  },
  contacts: {
    create: "/contacts",
    get: "/contacts/{id}",
    find: "/contacts/find",
  },
  conversations: {
    create: "/conversations",
    find: "/conversations/find",
    search: "/conversations/search",
    get: "/conversations/{id}",
    update: "/conversations/{id}",
    assign: "/conversations/{id}/assign",
    unassign: "/conversations/{id}/unassign",
    open: "/conversations/{id}/open",
    close: "/conversations/{id}/close",
    rate: "/conversations/{id}/rate",
    trigger_rating: "/conversations/{id}/trigger-rating",
    transcript: "/conversations/{id}/transcript",
    typing: "/conversations/{id}/typing",
    messages: "/conversations/{id}/messages",
    notes: "/conversations/{id}/notes",
    tags: "/conversations/{id}/tags",
    untag: "/conversations/{id}/tags/{tag_id}",
  },
  messages: {
    find: "/messages/find",
    get: "/messages/{id}",
  },
  files: {
    upload_token: "/files/upload/token",
  },
  visitors: {
    get: "/visitors/{id}",
    update: "/visitors/{id}",
    paths: "/visitors/{id}/paths",
    start_conversation: "/visitors/{id}/conversations",
    send_message: "/visitors/{id}/conversations/{conversation_id}/messages",
    open_conversation: "/visitors/{id}/conversations/{conversation_id}/open",
    typing: "/visitors/{id}/conversations/{conversation_id}/typing",
  },
  settings: {
    office_hours: "/settings/office-hours",
    domain_whitelist: "/settings/domain-whitelist",
  },
  statistics: {
    get: "/statistics",
  },
  tags: {
    list: "/tags",
    create: "/tags",
    update: "/tags/{tag_id}",
    delete: "/tags/{tag_id}",
  },
} as const;

/** Conversation statuses used by the search endpoint. */
export const CONVERSATION_STATUS = {
  open: "open",
  served: "served",
  closed: "closed",
} as const;

const NAMES: Record<string, string> = {
  "/": "Home",
  "/events": "Events",
  "/menu": "Menu",
  "/private-events": "Private events",
  "/pricing": "Pricing",
  "/company": "Company",
  "/safety": "Safety",
  "/legal": "Legal",
  "/help": "Help",
};

/** Friendly page name for a path. `title` is the event title when the path is an event page. */
export function pageName(path: string, title?: string | null) {
  const p = path.split("?")[0].replace(/(.)\/$/, "$1");
  if (NAMES[p]) return NAMES[p];
  if (p.startsWith("/events/")) return title ? `Event: ${title}` : "An event";
  if (p.startsWith("/info/")) {
    const t = p.slice(6).replace(/-/g, " ");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  return p;
}

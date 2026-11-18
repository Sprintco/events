import type { Metadata } from "next";

export const SITE_NAME = "AdultFriendFinder";
export const SITE_DESCRIPTION =
  "Discover public and private events and lounge nights, then reserve your spot through our support team.";

/** Public address of the site. Set NEXT_PUBLIC_SITE_URL to the real domain in production. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

/** Share image used by every page (1200x630). */
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: `${SITE_NAME} logo` };

/** Keeps descriptions short enough for search results and link previews. */
export const clip = (text: string, max = 160) => {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
};

/**
 * Metadata for one page: title, description, canonical URL, Open Graph and Twitter card.
 * Next.js replaces (not merges) `openGraph` and `twitter` from the layout, so every page repeats the image here.
 * `title` is the bare page name; the layout's title template adds " | AdultFriendFinder".
 */
export function pageMeta({
  title,
  description = SITE_DESCRIPTION,
  path,
  type = "website",
}: {
  title?: string;
  description?: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  const full = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = clip(description);
  return {
    ...(title && { title }),
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: full,
      description: desc,
      url: path,
      locale: "en_US",
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: full, description: desc, images: [OG_IMAGE.url] },
  };
}

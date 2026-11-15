// Adds demo page views (spread over the last 6 days) so the Trending lists have something to rank.
// Skips if any views already exist. Run: node --env-file=.env scripts/seed-views.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL.replace(/[?&]channel_binding=[^&]*/, ""));
const [{ c }] = await sql`select count(*)::int as c from event_views`;
if (c > 0) {
  console.log(`event_views already has ${c} rows, skipping.`);
} else {
  const evs = await sql`select id from events where starts_at >= now() order by id`;
  const counts = [40, 12, 31, 5, 22, 3, 17, 9];
  for (const [i, e] of evs.entries()) {
    const n = counts[i % counts.length];
    await sql`insert into event_views (event_id, created_at)
              select ${e.id}, now() - (random() * interval '6 days') from generate_series(1, ${n})`;
  }
  console.log("Seeded demo views for", evs.length, "events.");
}

// Seeds lifestyle demo events with generated cover art. Safe to re-run: skips titles that already exist.
// Run: node --env-file=.env scripts/seed.mjs
import { neon } from "@neondatabase/serverless";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL.replace(/[?&]channel_binding=[^&]*/, "");
const sql = neon(url);
const s3 = new S3Client({ forcePathStyle: true });
const BUCKET = process.env.S3_BUCKET || "events";

// [title, location, days from now, hour, price, private, description, palette(3 colours), shapes seed]
const EVENTS = [
  ["Velvet Room Opening Night", "The Velvet Room, River Oaks", 3, 21, 0, false,
   "Champagne on arrival, a live jazz trio and the first look at our newest lounge. Dress to impress; doors open at nine.", ["#2a0a16", "#b10f32", "#f7aa14"]],
  ["Midnight Jazz & Bourbon", "Fancy Lounge, Main Floor", 5, 22, 45, false,
   "A late set from the house quartet with a bourbon flight curated by our bar director. Seating is limited.", ["#140d08", "#7a3b12", "#f7aa14"]],
  ["Private Tasting: The Chef's Table", "Fancy Lounge, Semi-Private Bay", 8, 19, 180, true,
   "Seven courses, paired pours and the chef at your table. A private evening for up to twenty guests.", ["#0f1a14", "#2f5d3a", "#e9c46a"]],
  ["Rooftop Sunset Social", "Skyline Terrace, Midtown", 10, 18, 35, false,
   "Golden hour cocktails, a resident DJ and the best view in town. Relaxed dress code, easy conversation.", ["#2b1330", "#e0244a", "#ffb347"]],
  ["Black Tie Gala Dinner", "The Grand Ballroom", 14, 19, 250, true,
   "An evening of fine dining, live orchestra and a silent auction. Black tie required.", ["#0a0a16", "#3b3b7a", "#d4af37"]],
  ["Whiskey & Cigars Evening", "The Humidor Room", 16, 20, 95, true,
   "Hand-rolled cigars, rare whiskeys and a quiet room to enjoy them. Members and guests, 21+.", ["#1a0f08", "#5c3317", "#c8a05a"]],
  ["Sunday Brunch & Bubbles", "Fancy Lounge, Garden Patio", 18, 11, 55, false,
   "Bottomless bubbles, a chef's brunch menu and a live acoustic set on the patio.", ["#2a1a1f", "#f4a6b5", "#fff1d0"]],
  ["Wine Dinner: Napa Reserve", "Cellar 21", 21, 19, 140, false,
   "Five courses matched to reserve Napa vintages, hosted by the winemaker.", ["#1c0a12", "#6d1a36", "#d9a066"]],
  ["Masquerade Ball", "The Grand Ballroom", 25, 21, 120, true,
   "Masks required, mystery encouraged. Live band, couture cocktails and a midnight reveal.", ["#150a22", "#6a2c91", "#f7aa14"]],
  ["Live Music Lounge Night", "Fancy Lounge, Main Floor", 27, 21, 25, false,
   "Three rising artists, one intimate room. Table service available.", ["#0a1620", "#1f6f8b", "#f7aa14"]],
  ["Champagne & Caviar Soirée", "The Velvet Room", 31, 20, 160, true,
   "A tower-service evening of champagne and caviar pairings, with a DJ set after ten.", ["#18161c", "#8f8aa8", "#f2e3b3"]],
  ["Founders' Cocktail Reception", "Skyline Terrace, Midtown", 36, 18, 60, false,
   "Meet the founders over signature cocktails and passed bites. Business casual.", ["#0d1b1e", "#18727a", "#ffd166"]],
  ["New Year's Eve Countdown", "The Grand Ballroom", 49, 21, 300, false,
   "Open bar, live band, a champagne toast at midnight and a late-night breakfast bar.", ["#0a0a14", "#b10f32", "#f7aa14"]],
  ["Private Birthday Buyout", "Fancy Lounge, Full Venue", 55, 20, 2500, true,
   "Take over the whole lounge for up to eighty guests. Menu, music and bottle service tailored to you.", ["#1a0a1c", "#c2185b", "#f7aa14"]],
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function rng(seed) {
  let a = seed;
  return () => ((a = (a * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

async function cover(palette, seed) {
  const [dark, mid, light] = palette;
  const r = rng(seed);
  const orbs = Array.from({ length: 6 }, (_, i) => {
    const c = i % 3 === 0 ? light : i % 3 === 1 ? mid : light;
    return `<circle cx="${r() * 1600}" cy="${r() * 1000}" r="${120 + r() * 260}" fill="${c}" opacity="${0.15 + r() * 0.35}"/>`;
  }).join("");
  const lines = Array.from({ length: 5 }, () => `<line x1="${r() * 1600}" y1="0" x2="${r() * 1600}" y2="1000" stroke="${light}" stroke-opacity="0.08" stroke-width="2"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${dark}"/><stop offset="1" stop-color="${mid}" stop-opacity="0.55"/></linearGradient>
      <filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>
      <radialGradient id="v" cx="0.5" cy="0.5" r="0.75"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>
    </defs>
    <rect width="1600" height="1000" fill="url(#bg)"/>
    <g filter="url(#b)">${orbs}</g>
    ${lines}
    <rect width="1600" height="1000" fill="url(#v)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer();
}

let added = 0;
for (const [i, [title, location, days, hour, price, isPrivate, description, palette]] of EVENTS.entries()) {
  const [exists] = await sql`select 1 as x from events where title = ${title}`;
  if (exists) continue;
  const key = `covers/${randomUUID()}.webp`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: await cover(palette, 1000 + i * 77), ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
  await sql`insert into events (slug, title, description, location, starts_at, price_usd, is_private, cover_url)
            values (${slug}, ${title}, ${description}, ${location}, ${d.toISOString()}, ${price}, ${isPrivate}, ${"/media/" + key})`;
  added++;
}

// A few demo registrations so "Trending" has something to rank.
const evs = await sql`select id, title from events order by id`;
const bump = { "Velvet Room Opening Night": 14, "Rooftop Sunset Social": 9, "Black Tie Gala Dinner": 6, "New Year's Eve Countdown": 11 };
for (const e of evs) {
  const n = bump[e.title];
  if (!n) continue;
  const [{ c }] = await sql`select count(*)::int as c from registrations where event_id = ${e.id} and email like '%@demo.invalid'`;
  for (let k = c; k < n; k++) {
    await sql`insert into registrations (event_id, name, email) values (${e.id}, ${"Guest " + (k + 1)}, ${`guest${k + 1}-${e.id}@demo.invalid`})`;
  }
}
console.log(`Seeded ${added} new events.`);

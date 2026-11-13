// Replaces the gradient covers of the seeded demo events with AI-generated photos (Higgsfield z_image).
// Run: node --env-file=.env scripts/gen-covers.mjs   (needs the `higgsfield` CLI logged in; costs ~0.15 credits per image)
import { neon } from "@neondatabase/serverless";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
// Path to the CLI's JS entry (spawning the .cmd shim fails on Windows). Override with HF_BIN.
const HF = process.env.HF_BIN || "C:/nvm4w/nodejs/node_modules/@higgsfield/cli/bin/higgsfield.js";
const sql = neon(process.env.DATABASE_URL.replace(/[?&]channel_binding=[^&]*/, ""));
const s3 = new S3Client({ forcePathStyle: true });
const BUCKET = process.env.S3_BUCKET || "events";
const STYLE = "editorial photograph, cinematic, shallow depth of field, rich warm tones, luxury lifestyle venue, no text, no logos, no watermark";

const PROMPTS = {
  "Velvet Room Opening Night": "Opening night of an upscale velvet-curtained lounge, guests toasting champagne, crimson and gold lighting",
  "Midnight Jazz & Bourbon": "Jazz quartet on a dim stage with saxophone, a bourbon glass with ice on a bar in the foreground, amber light",
  "Private Tasting: The Chef's Table": "Chef plating an elegant tasting course at an intimate private dining table, candlelight, white linen",
  "Rooftop Sunset Social": "Rooftop terrace at golden hour sunset, stylish people with cocktails, city skyline, string lights",
  "Black Tie Gala Dinner": "Grand ballroom gala dinner, round tables with white linen and crystal chandeliers, guests in black tie",
  "Whiskey & Cigars Evening": "Leather armchairs in a dark cigar lounge, a lit cigar and a glass of whiskey on a wooden table, smoke curling",
  "Sunday Brunch & Bubbles": "Sunny garden patio brunch table with champagne flutes, pastries and fresh fruit, soft morning light",
  "Wine Dinner: Napa Reserve": "Candlelit wine dinner, bottles of red wine and glasses on a long table in a stone cellar",
  "Masquerade Ball": "Masquerade ball, guests in ornate venetian masks and gowns, dramatic purple and gold ballroom lighting",
  "Live Music Lounge Night": "Singer with a guitar performing in an intimate lounge, blue and amber stage lights, small audience at tables",
  "Champagne & Caviar Soirée": "Champagne tower and caviar service on a silver tray, elegant evening, soft silver and gold light",
  "Founders' Cocktail Reception": "Business casual cocktail reception on a terrace at dusk, people chatting with signature cocktails, teal and gold light",
  "New Year's Eve Countdown": "New Year's Eve party at midnight, gold confetti, champagne glasses raised, crowd celebrating in a ballroom",
  "Private Birthday Buyout": "Private birthday party in a luxury lounge, bottle service with sparklers, friends celebrating, pink and gold lighting",
};

async function one([title, subject]) {
  const [ev] = await sql`select id, cover_url from events where title = ${title}`;
  if (!ev) return console.log("skip (no event):", title);
  const { stdout } = await run(
    process.execPath,
    [HF, "generate", "create", "z_image", "--prompt", `${subject}, ${STYLE}`, "--aspect_ratio", "3:4", "--wait"],
    { maxBuffer: 10 << 20 },
  );
  const imgUrl = stdout.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|webp)/i)?.[0];
  if (!imgUrl) throw new Error(`no image url for ${title}: ${stdout.slice(-200)}`);
  const raw = Buffer.from(await (await fetch(imgUrl)).arrayBuffer());
  const body = await sharp(raw).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const key = `covers/${randomUUID()}.webp`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: body, ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  await sql`update events set cover_url = ${"/media/" + key} where id = ${ev.id}`;
  const old = ev.cover_url?.replace(/^\/media\//, "");
  if (old && /^covers\/[a-f0-9-]{36}\.webp$/.test(old)) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: old })).catch(() => {});
  }
  console.log("done:", title);
}

// SKIP="title one|title two" skips events already done; CONCURRENCY defaults to 1 (parallel runs get rate limited).
const skip = new Set((process.env.SKIP || "").split("|").filter(Boolean));
const entries = Object.entries(PROMPTS).filter(([t]) => !skip.has(t));
const N = Number(process.env.CONCURRENCY || 1);
const failed = [];
for (let i = 0; i < entries.length; i += N) {
  await Promise.all(entries.slice(i, i + N).map((e) => one(e).catch((err) => { failed.push(e[0]); console.log("FAILED:", e[0], err.message.slice(0, 200)); })));
}
console.log(failed.length ? `Finished with ${failed.length} failed: ${failed.join(", ")}` : "All covers replaced.");

import { neon } from "@neondatabase/serverless";

type Row = Record<string, unknown>;
type Sql = <T = Row[]>(strings: TemplateStringsArray, ...values: unknown[]) => Promise<T>;

const globalForDb = globalThis as unknown as { neonSql?: Sql; schemaV8?: Promise<void> };

function client(): Sql {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local (see .env.example).");
  }
  // Neon over HTTPS (port 443). channel_binding is not needed for the HTTP driver.
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.delete("channel_binding");
  return (globalForDb.neonSql ??= neon(url.toString()) as unknown as Sql);
}

/** Returns the sql client after making sure tables exist (runs once per process). */
export async function db() {
  const sql = client();
  globalForDb.schemaV8 ??= (async () => {
    await sql`create table if not exists events (
      id serial primary key,
      slug text unique not null,
      title text not null,
      description text not null default '',
      location text not null default '',
      starts_at timestamptz not null,
      price_usd numeric(10,2) not null default 0,
      is_private boolean not null default true,
      created_at timestamptz not null default now()
    )`;
    await sql`alter table events add column if not exists cover_url text`;
    await sql`create table if not exists registrations (
      id serial primary key,
      event_id int not null references events(id) on delete cascade,
      name text not null,
      email text not null,
      paid boolean not null default false,
      created_at timestamptz not null default now()
    )`;
    await sql`create table if not exists chat_conversations (
      id uuid primary key,
      name text not null default 'Visitor',
      created_at timestamptz not null default now()
    )`;
    await sql`alter table chat_conversations add column if not exists admin_typing_at timestamptz`;
    await sql`alter table chat_conversations add column if not exists visitor_typing_at timestamptz`;
    await sql`alter table chat_conversations add column if not exists closed_at timestamptz`;
    await sql`alter table chat_conversations add column if not exists email text`;
    await sql`alter table chat_conversations add column if not exists phone text`;
    await sql`create table if not exists chat_messages (
      id serial primary key,
      conversation_id uuid not null references chat_conversations(id) on delete cascade,
      sender text not null check (sender in ('visitor','admin')),
      body text not null,
      created_at timestamptz not null default now()
    )`;
    await sql`alter table chat_messages add column if not exists read_at timestamptz`;
    await sql`create table if not exists visitors (
      id uuid primary key,
      arrived_at timestamptz not null default now(),
      last_seen timestamptz not null default now(),
      path text not null default '/',
      conversation_id uuid
    )`;
  })().catch((e) => {
    globalForDb.schemaV8 = undefined;
    throw e;
  });
  await globalForDb.schemaV8;
  return sql;
}

export type EventRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  location: string;
  starts_at: Date;
  price_usd: string;
  is_private: boolean;
  cover_url: string | null;
};

export const formatPrice = (p: string | number) =>
  Number(p) === 0
    ? "Free"
    : `$${Number(p).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const formatDate = (d: Date) =>
  new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

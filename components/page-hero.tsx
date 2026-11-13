/** Dark, atmospheric page header shared by the Events, Menu and Private events pages. */
export function PageHero({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <div className="absolute -left-24 -top-24 -z-10 size-96 rounded-full bg-primary/40 blur-3xl" />
      <div className="absolute -bottom-32 right-1/4 -z-10 size-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="px-4 py-16 text-center sm:px-6 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight md:text-6xl">{title}</h1>
        {sub && <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">{sub}</p>}
        {children && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>}
      </div>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-muted-foreground">{sub}</p>}
    </div>
  );
}

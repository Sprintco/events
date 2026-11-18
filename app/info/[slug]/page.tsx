import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { INFO_PAGES } from "@/lib/info-pages";
import { pageMeta } from "@/lib/seo";

export function generateStaticParams() {
  return Object.keys(INFO_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/info/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = INFO_PAGES[slug];
  if (!page) return { title: "Page not found", robots: { index: false } };
  return pageMeta({ title: page.title, description: page.body, path: `/info/${slug}` });
}

async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = INFO_PAGES[slug];
  if (!page) notFound();
  return (
    <>
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </Link>
      <h1 className="mt-6 text-3xl font-bold">{page.title}</h1>
      <p className="mt-4 leading-7 text-muted-foreground">{page.body}</p>
      {/* <p className="mt-8 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Placeholder text. Replace with your final copy before launch.
      </p> */}
    </>
  );
}

export default function InfoPage({ params }: PageProps<"/info/[slug]">) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <Suspense fallback={null}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}

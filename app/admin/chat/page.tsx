import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { Inbox } from "./inbox";

async function ChatGate() {
  const me = await currentAdmin();
  if (!me) redirect("/admin/login");
  if (me.must_change) redirect("/admin/account");
  return (
    <main className="px-4 sm:px-6 py-10">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
      <h1 className="mt-2 text-3xl font-bold">Support inbox</h1>
      <Inbox />
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<p className="px-4 sm:px-6 py-10 text-muted-foreground">Loading…</p>}>
      <ChatGate />
    </Suspense>
  );
}

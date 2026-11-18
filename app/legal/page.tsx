import { HubPage } from "@/components/hub-page";
import { HUBS } from "@/lib/hubs";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Legal", description: HUBS.legal.intro, path: "/legal" });

export default function Page() {
  return <HubPage hub={HUBS.legal} />;
}

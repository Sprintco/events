import { HubPage } from "@/components/hub-page";
import { HUBS } from "@/lib/hubs";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Help", description: HUBS.help.intro, path: "/help" });

export default function Page() {
  return <HubPage hub={HUBS.help} />;
}

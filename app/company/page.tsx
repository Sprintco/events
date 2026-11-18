import { HubPage } from "@/components/hub-page";
import { HUBS } from "@/lib/hubs";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Company", description: HUBS.company.intro, path: "/company" });

export default function Page() {
  return <HubPage hub={HUBS.company} />;
}

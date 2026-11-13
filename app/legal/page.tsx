import { HubPage } from "@/components/hub-page";
import { HUBS } from "@/lib/hubs";

export const metadata = { title: "Legal - AdultFriendFinder" };

export default function Page() {
  return <HubPage hub={HUBS.legal} />;
}

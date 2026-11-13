import { HubPage } from "@/components/hub-page";
import { HUBS } from "@/lib/hubs";

export const metadata = { title: "Help - AdultFriendFinder" };

export default function Page() {
  return <HubPage hub={HUBS.help} />;
}

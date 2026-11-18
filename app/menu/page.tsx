import { PageHero } from "@/components/page-hero";
import { MenuTabs } from "@/components/menu-tabs";
import { ReserveButton } from "@/components/reserve-button";
import { DINNER, DRINKS } from "@/lib/menu";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Menu", description: "Browse the lounge menu: starters, entrées, sides and drinks.", path: "/menu" });

export default function MenuPage() {
  return (
    <main>
      <PageHero
        eyebrow="The Menu"
        title="Curated for the refined palate"
        sub="Seasonal plates, signature cocktails and bottle service, served until late.">
        <ReserveButton />
      </PageHero>
      <section className="px-4 py-14 sm:px-6">
        <MenuTabs dinner={DINNER} drinks={DRINKS} />
      </section>
    </main>
  );
}

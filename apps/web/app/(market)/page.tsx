import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DeckleEdge, Woven } from "@/components/karu/ornaments";
import { ProductGrid } from "@/components/karu/product-card";
import { Container, Section, SectionHeader } from "@/components/layout";
import { MakerSpotlight } from "@/components/market/artisan-spotlight";
import { CategoryShowcase } from "@/components/market/category-showcase";
import { EditBanner } from "@/components/market/edit-banner";
import { FeaturedRail } from "@/components/market/featured-rail";
import { HeritageGrid } from "@/components/market/heritage-process";
import { HeroCarousel } from "@/components/market/hero-carousel";
import { PatronVoices } from "@/components/market/patron-testimonials";
import { ProvenanceSteps } from "@/components/market/provenance-steps";
import { RecentlyViewed } from "@/components/market/recently-viewed";
import { RegionStrip } from "@/components/market/region-strip";
import { TrustStrip } from "@/components/market/trust-strip";
import { StatTile } from "@/components/ui/stat-tile";
import { serverApi } from "@/lib/server-api";
import type { Card, Maker } from "@/lib/types";

interface HomeData {
  categories: { slug: string; name: string; icon: string; count: number }[];
  verified_picks: Card[];
  new_arrivals: Card[];
  craft_rails: { craft: { slug: string; name: string; gi_tag: boolean; regions: string[] }; items: Card[] }[];
  makers: Maker[];
  impact: { artisans: number; pieces_verified: number; paid_to_artisans: string; clusters: number; states: number };
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const data = await serverApi<HomeData>("/catalog/home", { revalidate: 60, tags: ["home"] });
  const featuredMaker = data.makers.find((m) => m.photo_url && m.story) || data.makers[0];

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Carousel (Full-bleed 640px, 5/7 split, Mrittika slide indicators) */}
      <HeroCarousel cards={data.verified_picks} />

      {/* 2. Trust Strip on surface-alt */}
      <Section tone="alt" pad="tight">
        <Container size="page">
          <TrustStrip />
        </Container>
      </Section>

      {/* 3. Shop by Craft (8 Circular Portals) */}
      <Section tone="bg" pad="default">
        <Container size="page">
          <SectionHeader
            align="center"
            eyebrow="Craft Disciplines"
            title="Explore by Craft"
            accentWord="Heritage"
            intro="Generational Indian craft disciplines certified by Karu provenance standards."
            action={{ href: "/categories", label: "All Categories" }}
          />
          <CategoryShowcase categories={data.categories} />
        </Container>
      </Section>

      {/* 4. New & Verified Collection (5-col Grid on Desktop) */}
      {data.verified_picks.length > 0 && (
        <Section tone="bg" pad="tight">
          <Container size="page">
            <SectionHeader
              eyebrow="Shop the Look"
              title="New Collection"
              accentWord="Handmade"
              intro="Proven handmade with unedited physical making video proof from the artisan."
              action={{ href: "/search?verified=true", label: "View All Verified" }}
            />
            <ProductGrid cards={data.verified_picks.slice(0, 10)} />
          </Container>
        </Section>
      )}

      {/* 5. Rooted in Heritage (12-col Technique Grid on surface-alt) */}
      <Section tone="alt" pad="default">
        <Container size="page">
          <HeritageGrid />
        </Container>
      </Section>

      {/* 6. Shop by Region (Full-bleed container-wide 6-col strip) */}
      <Section tone="bg" pad="default">
        <Container size="wide">
          <SectionHeader
            align="split"
            eyebrow="Cluster Lineages"
            title="Shop by Region"
            accentWord="Origins"
            intro="Explore pieces directly from India's most celebrated heritage craft clusters."
            action={{ href: "/categories#crafts", label: "All Regions" }}
          />
          <RegionStrip />
        </Container>
      </Section>

      {/* 7. The Karu Edit Banner */}
      <Section tone="bg" pad="tight">
        <Container size="page">
          <EditBanner />
        </Container>
      </Section>

      {/* 8. Craft Rails with FeaturedRail (Alternating) */}
      {data.craft_rails.map((rail, idx) => (
        <Section key={rail.craft.slug} tone={idx % 2 === 0 ? "bg" : "alt"} pad="default">
          <Container size="page">
            <FeaturedRail
              craft={rail.craft}
              items={rail.items}
              reversed={idx % 2 === 1}
            />
          </Container>
        </Section>
      ))}

      {/* 9. Story Behind Every Piece (Artisan Spotlight) */}
      {featuredMaker && (
        <Section tone="bg" pad="default">
          <Container size="page">
            <MakerSpotlight maker={featuredMaker} />
          </Container>
        </Section>
      )}

      {/* 10. Patron Voices (Gracefully hides if fewer than 3 real reviews exist) */}
      <PatronVoices />

      {/* 11. How Karu Proves It (Provenance Steps) */}
      <Section tone="alt" pad="default">
        <Container size="page">
          <SectionHeader
            align="center"
            eyebrow="The Proof Standard"
            title="How Karu Proves It"
            accentWord="Integrity"
            intro="Every physical unit is checked against weave irregularities, artisan registries, and video evidence."
          />
          <ProvenanceSteps />
        </Container>
      </Section>

      {/* 12. Impact Band */}
      <Section tone="bg" pad="default">
        <Container size="page">
          <div className="flex flex-col gap-8">
            <Woven />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <StatTile label="Master Artisans" value={String(data.impact.artisans)} hint="Across certified clusters" />
              <StatTile label="Pieces Verified" value={String(data.impact.pieces_verified)} hint="100% physically proven" />
              <StatTile label="Paid to Artisans" value={data.impact.paid_to_artisans || "100%"} hint="0% platform commission" />
              <StatTile label="Craft Clusters" value={String(data.impact.clusters)} hint="In 3 heritage states" />
            </div>
            <div className="flex items-center justify-between border-t border-line pt-4 text-caption text-muted">
              <p className="font-serif italic">
                Zero machine intermediaries. Every rupee accounted for on the Karu public ledger.
              </p>
              <Link href="/impact" className="inline-flex items-center gap-1 text-eyebrow text-brand hover:underline">
                <span>View Full Impact Report</span>
                <ArrowRight className="size-3.5 flip-rtl" />
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <RecentlyViewed />
    </div>
  );
}

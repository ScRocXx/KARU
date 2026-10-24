import { getTranslations } from "next-intl/server";
import { DeckleEdge, Woven } from "@/components/karu/ornaments";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { StatTile } from "@/components/ui/stat-tile";
import { serverApi } from "@/lib/server-api";

export const metadata = { title: "Public Impact Ledger · Karu" };

export default async function ImpactPage() {
  const t = await getTranslations("impact");
  const d = await serverApi<{
    artisans: number;
    pieces_verified: number;
    paid_to_artisans: string;
    clusters: number;
    states: number;
  }>("/impact", { revalidate: 300 });

  return (
    <div className="w-full">
      {/* Header Band */}
      <section className="bg-surface-alt border-b border-line pt-12 pb-14">
        <div className="container-page text-center">
          <span className="text-eyebrow text-brand">Public Provenance Ledger</span>
          <h1 className="font-serif text-display text-ink-900 mt-2">
            Measurable, Verified Impact
          </h1>
          <p className="mx-auto max-w-2xl text-body-l text-muted mt-3 leading-relaxed">
            Every rupee generated through Karu flows directly to certified artisans. We track provenance, physical authenticity, and economic empowerment with zero marketplace commission.
          </p>
        </div>
      </section>

      <div className="container-page py-12 flex flex-col gap-12">
        {/* Large Stat Numerals Grid */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Master Artisans" value={d.artisans} />
          <StatTile label="Pieces Verified" value={d.pieces_verified} />
          <StatTile label="Paid to Artisans" value={d.paid_to_artisans} />
          <StatTile label="Regional Clusters" value={d.clusters} />
          <StatTile label="States Active" value={d.states} />
        </div>

        {/* Where The Money Goes: CSS Transparent Bar */}
        <section className="rounded-sm border border-line bg-surface p-8 shadow-xs flex flex-col gap-6">
          <div>
            <span className="text-eyebrow text-brand">Transparent Economics</span>
            <h2 className="font-serif text-h2 text-ink-900 mt-1">
              Where 100% of the Product Price Goes
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {/* Split Bar */}
            <div className="h-6 w-full rounded-full overflow-hidden flex bg-sand-200">
              <div className="bg-brand h-full transition-all" style={{ width: "90%" }} title="90% Direct Maker Pay" />
              <div className="bg-gold-500 h-full transition-all" style={{ width: "10%" }} title="10% Packaging & Tagging" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 text-body-s pt-2">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-brand" />
                <span className="font-medium text-ink-900">90% Direct Maker Bank Transfer</span>
                <span className="text-muted">(Materials, Labour, Living Wage)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-gold-500" />
                <span className="font-medium text-ink-900">10% Physical Cluster Tagging & Safe Box</span>
              </div>
            </div>
          </div>

          <div className="rounded-xs bg-verified-soft p-4 text-body-s font-medium text-verified border border-peacock-200">
            Karu charges 0% commission to artisans. Operating costs are sponsored through institutional grants, patron gifts, and transparent bulk sourcing services.
          </div>
        </section>

        {/* Methodology Accordion */}
        <section className="rounded-sm border border-line bg-surface p-8 shadow-xs">
          <h2 className="font-serif text-h3 text-ink-900 mb-4">Verification Methodology</h2>
          <Accordion className="divide-y divide-line">
            <AccordionItem title="Physical Thread & Chisel Verification">
              Every unit is physically checked at the workshop cluster against our deterministic provenance schema. Machine weaves, synthetic polyesters posing as silk, and chemical dyes in natural-dye claims are rejected.
            </AccordionItem>
            <AccordionItem title="Tamper-Evident Physical Karu ID Tags">
              Each certified piece is sealed with a serialized QR tag registered on the Karu immutable registry before courier pickup, linking buyer directly to the maker's workshop passport.
            </AccordionItem>
            <AccordionItem title="Zero Pixel Hallucination Policy">
              Catalog photography preserves 100% of the artisan's original physical product pixels. Relighting and studio staging never modify weave motifs or carve textures.
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </div>
  );
}

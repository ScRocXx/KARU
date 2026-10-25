import type { Metadata } from "next";
import { MakerCard } from "@/components/karu/maker-card";
import { EmptyState } from "@/components/ui/empty-state";
import { serverApi } from "@/lib/server-api";
import type { Maker } from "@/lib/types";

export const metadata: Metadata = {
  title: "Meet the Makers · Karu",
  description: "Direct access to master artisans, handloom weavers, and folk artists across India.",
};

export default async function MakersDirectoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ craft?: string; state?: string }>;
}) {
  const sp = await searchParams;
  const craft = sp?.craft || "";
  const state = sp?.state || "";

  let makers: Maker[] = [];
  try {
    const query = new URLSearchParams();
    if (craft) query.set("craft", craft);
    if (state) query.set("state", state);
    const res = await serverApi<{ items: Maker[]; total: number }>(`/makers?${query.toString()}`, {
      revalidate: 60,
    });
    makers = res.items || [];
  } catch {
    makers = [];
  }

  return (
    <div className="w-full">
      {/* 1. Header Band with Terracotta / Deckle Edge */}
      <section className="bg-surface-alt border-b border-line pt-10 pb-12">
        <div className="container-page text-center">
          <span className="text-eyebrow text-brand">The Human Provenance</span>
          <h1 className="font-serif text-display text-ink-900 mt-2">
            Meet the Makers
          </h1>
          <p className="mx-auto max-w-xl text-body text-muted mt-3">
            Every thread, chisel mark, and clay curve has a name. Explore certified master artisans preserving India&apos;s ancestral craft traditions.
          </p>
        </div>
      </section>

      {/* 2. Makers Directory Grid */}
      <div className="container-page py-12">
        {makers.length === 0 ? (
          <EmptyState
            art="basket"
            title="No makers found"
            description="We are regularly certifying and onboarding master artisans from regional clusters across India."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {makers.map((m) => (
              <MakerCard key={m.id} maker={m} variant="tile" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

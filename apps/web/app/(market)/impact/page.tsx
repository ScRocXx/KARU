import { getTranslations } from "next-intl/server";
import { Woven } from "@/components/karu/badges";
import { serverApi } from "@/lib/server-api";

export const metadata = { title: "Impact" };

/** B15: public impact counters. */
export default async function ImpactPage() {
  const t = await getTranslations("impact");
  const d = await serverApi<{ artisans: number; pieces_verified: number; paid_to_artisans: string; clusters: number; states: number }>("/impact", { revalidate: 300 });
  const stats = [
    [String(d.artisans), t("artisans")],
    [String(d.pieces_verified), t("pieces_verified")],
    [d.paid_to_artisans, t("paid")],
    [String(d.clusters), t("clusters")],
    [String(d.states), t("states")],
  ];
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-10">
      <h1 className="font-display text-[32px] md:text-5xl">{t("title")}</h1>
      <p className="max-w-2xl text-[17px] text-ink-600">{t("intro")}</p>
      <Woven />
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
        {stats.map(([v, l]) => (
          <div key={l} className="rounded-[16px] bg-white p-6">
            <p className="font-display text-4xl text-indigo-900">{v}</p>
            <p className="text-ink-600">{l}</p>
          </div>
        ))}
      </div>
      <p className="rounded-[16px] bg-peacock-50 p-5 text-peacock-600">{t("zero_commission")}</p>
    </div>
  );
}

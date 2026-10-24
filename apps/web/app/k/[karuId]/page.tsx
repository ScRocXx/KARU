import { BadgeCheck, CircleDashed, ShieldOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ProofChecks, Woven } from "@/components/karu/badges";
import { LangLinks, OwnedByYou, ReportButton, ScanBeacon, TapToPlayVideo, VoiceClip } from "@/components/proof/islands";
import { inr } from "@/lib/format";
import { serverApiOrNull } from "@/lib/server-api";
import type { KaruIdPage, Maker } from "@/lib/types";

// The QR target (Part 1 §4.3): server-rendered, cached per locale, minimal JS, verdict above the fold.
export const revalidate = 120;

async function load(id: string) {
  return serverApiOrNull<KaruIdPage>(`/karu-ids/${encodeURIComponent(id.toUpperCase())}`, { revalidate: 120, tags: [`k:${id.toUpperCase()}`] });
}

export async function generateMetadata({ params }: { params: Promise<{ karuId: string }> }): Promise<Metadata> {
  const d = await load((await params).karuId);
  if (!d) return { title: "Karu ID" };
  return { title: `${d.code} · ${d.piece.title}`, description: `${d.verified_label} · ${d.piece.region}`, robots: { index: false } };
}

export default async function KaruIdPageView({ params }: { params: Promise<{ karuId: string }> }) {
  const { karuId } = await params;
  const d = await load(karuId);
  if (!d) notFound();
  const [t, locale] = await Promise.all([getTranslations("kid"), getLocale()]);
  const verified = d.verdict === "verified";
  const maker = "under_review" in d.maker ? null : (d.maker as Maker);
  const firstName = maker?.name.split(" ")[0] || "";

  return (
    <div className="min-h-dvh bg-khadi-50">
      <ScanBeacon type="karu_id" code={d.code} />
      {/* 1. Header band */}
      <header className={verified ? "bg-indigo-900 text-white" : "bg-ink-900 text-white"}>
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-xl font-semibold">karu</Link>
          <LangLinks current={locale} />
        </div>
        <div className="mx-auto max-w-xl px-4 pb-5">
          <p className="font-mono text-sm tracking-widest text-white/80">{d.code}</p>
          <div className="mt-2 flex items-center gap-2">
            {verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-peacock-600 px-4 py-2 text-lg font-semibold">
                <BadgeCheck className="size-6" /> {t("verified")}
              </span>
            ) : d.verdict === "revoked" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-lg font-semibold">
                <ShieldOff className="size-6" /> {t("revoked")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-unverified px-4 py-2 text-lg font-semibold">
                <CircleDashed className="size-6" /> {d.verdict === "checking" ? t("checking") : t("not_verified")}
              </span>
            )}
          </div>
          {verified && maker && <p className="mt-3 text-[17px] text-white/90">{t("verified_line", { craft: d.piece.craft || t("handmade"), name: firstName, place: d.piece.region })}</p>}
        </div>
        <Woven />
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6">
        {d.sold && !d.owned_by_viewer && <p id="kid-sold-notice" className="rounded-[12px] border border-haldi-500/50 bg-haldi-100 p-3 text-[15px] font-medium">{t("sold_notice", { date: d.sold_on || "" })}</p>}
        <OwnedByYou code={d.code} label={t("owned_by_you")} />

        {/* 2. The piece */}
        <section className="overflow-hidden rounded-[16px] bg-white">
          {d.piece.image?.card && <img src={d.piece.image.card} alt={d.piece.title} className="aspect-[4/5] w-full object-cover" fetchPriority="high" />}
          <div className="p-4">
            <h1 className="font-display text-2xl" lang={d.piece.title_lang}>{d.piece.title}</h1>
            <p className="text-ink-600">{[d.piece.craft, d.piece.region].filter(Boolean).join(" · ")}</p>
          </div>
        </section>

        {/* 3. The maker */}
        <section className="rounded-[16px] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-600">{t("the_maker")}</h2>
          {maker ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {maker.photo_url ? <img src={maker.photo_url} alt="" className="size-16 rounded-full object-cover" loading="lazy" /> : null}
                <div>
                  <Link href={`/m/${maker.handle}`} className="font-display text-xl hover:underline">{maker.name}</Link>
                  <p className="text-sm text-ink-600">{maker.place}</p>
                  <p className="text-sm font-semibold">
                    {maker.passport.state === "verified" ? <span className="text-peacock-600">✓ {t("passport_verified")}</span> : <span className="text-ink-600">{t("passport_unverified")}</span>}
                    {maker.years_of_practice ? <span className="text-ink-600"> · {t("years", { n: maker.years_of_practice })}</span> : null}
                  </p>
                </div>
              </div>
              {maker.voice_url && <VoiceClip url={maker.voice_url} label={t("listen", { name: firstName })} />}
              {maker.story && <p className="text-[16px] leading-relaxed" lang={maker.story_lang}>“{maker.story}”</p>}
            </div>
          ) : (
            <p className="text-ink-600">{t("maker_under_review")}</p>
          )}
        </section>

        {/* 4. The proof (verified only) */}
        {verified && (
          <section className="rounded-[16px] bg-white p-4">
            <h2 className="font-display mb-3 text-xl">{t("the_proof")}</h2>
            <ProofChecks checks={d.proof.checks} photosOriginal={d.proof.photos_original} registry={d.proof.registry} />
            {d.proof.making_video && (
              <div className="mt-4">
                <TapToPlayVideo url={d.proof.making_video.url} poster={d.proof.making_video.poster} label={t("watch_making")} />
              </div>
            )}
          </section>
        )}
        {d.verdict === "revoked" && <p className="rounded-[12px] bg-white p-4 text-ink-600">{t("revoked_body", { date: d.proof.revoked_on || "" })}</p>}

        {/* 5. This unit's journey */}
        <section className="rounded-[16px] bg-white p-4">
          <h2 className="font-display mb-3 text-xl">{t("journey")}</h2>
          <ol className="relative ms-3 border-s-2 border-ink-100">
            {d.journey.map((j, i) => (
              <li key={i} className="mb-4 ms-5 last:mb-0">
                <span className="absolute -start-[9px] mt-1.5 size-4 rounded-full border-2 border-white bg-indigo-900" />
                <p className="font-semibold">{t(`event.${j.event}`, { city: j.city || "" })}</p>
                <p className="text-sm text-ink-600">{j.date}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 6. Market context (verified only) */}
        {d.market_context && <p className="rounded-[12px] bg-peacock-50 p-4 text-[15px] text-peacock-600">{t("market", { low: d.market_context.low, high: d.market_context.high })}</p>}

        {/* 7. Action */}
        <section className="flex flex-col gap-2">
          {d.piece.available ? (
            <Link href={`/p/${d.piece.code}`} className="flex min-h-12 items-center justify-center rounded-[10px] bg-indigo-900 px-5 font-semibold text-white">
              {t("buy", { price: inr(d.piece.price_inr) })}
            </Link>
          ) : (
            <Link href={`/p/${d.piece.code}`} className="flex min-h-12 items-center justify-center rounded-[10px] bg-indigo-900 px-5 font-semibold text-white">
              {t("request_again")}
            </Link>
          )}
          {maker && (
            <Link href={`/m/${maker.handle}`} className="flex min-h-12 items-center justify-center rounded-[10px] border-2 border-indigo-900 px-5 font-semibold text-indigo-900">
              {t("more_from", { name: firstName })}
            </Link>
          )}
        </section>

        {/* 8. Report */}
        <footer className="flex flex-col items-center gap-2 py-4 text-center">
          <ReportButton code={d.code} labels={{ link: t("report"), sent: t("report_sent"), prompt: t("report_prompt") }} />
          <Link href="/verification-explained" className="text-sm text-indigo-900 underline">{t("how_it_works")}</Link>
        </footer>
      </main>
    </div>
  );
}

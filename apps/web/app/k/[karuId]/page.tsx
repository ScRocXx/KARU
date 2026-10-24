import { ArrowRight, BadgeCheck, CircleDashed, ShieldCheck, ShieldOff } from "lucide-react";
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
    <div className="min-h-dvh bg-[#FAF7F2] text-ink-950 pb-16">
      <ScanBeacon type="karu_id" code={d.code} />

      {/* 1. High-Editorial Provenance Certificate Header */}
      <header className={verified ? "bg-[#1E251E] text-white" : "bg-ink-950 text-white"}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl font-semibold tracking-wider text-white">karu</span>
            <span className="hidden sm:inline text-[10px] font-mono tracking-widest uppercase text-sand-300/80 border-s border-white/20 ps-2.5">
              Certificate of Provenance
            </span>
          </Link>
          <LangLinks current={locale} />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-[0.25em] uppercase text-sand-300/80">
                Tamper-Evident ID · {d.code}
              </p>
              <div className="mt-2 flex items-center gap-2.5">
                {verified ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-peacock-700/80 border border-peacock-400/40 px-4 py-1.5 text-base sm:text-lg font-medium text-white shadow-xs">
                    <BadgeCheck className="size-5 text-peacock-300" /> {t("verified")}
                  </span>
                ) : d.verdict === "revoked" ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-base sm:text-lg font-medium">
                    <ShieldOff className="size-5" /> {t("revoked")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-unverified px-4 py-1.5 text-base sm:text-lg font-medium">
                    <CircleDashed className="size-5" /> {d.verdict === "checking" ? t("checking") : t("not_verified")}
                  </span>
                )}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gold-400">
                100% Physical Origin Checked
              </span>
              <p className="font-mono text-xs text-sand-300/70 mt-0.5">
                Tamper-proof registry record on the Karu public ledger
              </p>
            </div>
          </div>

          {verified && maker && (
            <p className="mt-4 font-serif text-lg sm:text-xl text-sand-100 max-w-3xl leading-relaxed">
              {t("verified_line", { craft: d.piece.craft || t("handmade"), name: firstName, place: d.piece.region })}
            </p>
          )}
        </div>
        <Woven />
      </header>

      {/* 2. Responsive 2-Column Certificate Layout */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
        {d.sold && !d.owned_by_viewer && (
          <div id="kid-sold-notice" className="mb-6 rounded-[16px] border border-gold-400/60 bg-gold-50 p-4 text-sm font-medium text-gold-950">
            {t("sold_notice", { date: d.sold_on || "" })}
          </div>
        )}
        <OwnedByYou code={d.code} label={t("owned_by_you")} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Physical Piece & Video Evidence */}
          <div className="flex flex-col gap-6">
            {/* Piece Presentation Card */}
            <section className="overflow-hidden rounded-[20px] border border-sand-200/90 bg-white shadow-xs">
              {d.piece.image?.card && (
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand-100">
                  <img
                    src={d.piece.image.card}
                    alt={d.piece.title}
                    className="size-full object-cover"
                    fetchPriority="high"
                  />
                  <div className="absolute end-3 bottom-3 rounded-full border border-sand-200 bg-white/90 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-800 backdrop-blur-md">
                    ID #{d.code}
                  </div>
                </div>
              )}
              <div className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-terracotta-700">
                  {[d.piece.craft, d.piece.region].filter(Boolean).join(" · ")}
                </p>
                <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-medium leading-tight text-ink-950" lang={d.piece.title_lang}>
                  {d.piece.title}
                </h1>
              </div>
            </section>

            {/* Unedited Making Video (Verified only) */}
            {verified && d.proof.making_video && (
              <section className="rounded-[20px] border border-sand-200/90 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl font-medium text-ink-950">
                    {t("watch_making")}
                  </h2>
                  <span className="rounded-full bg-peacock-50 border border-peacock-200/80 px-2.5 py-0.5 text-[10px] font-semibold text-peacock-700 uppercase tracking-wider">
                    Unedited Video Proof
                  </span>
                </div>
                <TapToPlayVideo
                  url={d.proof.making_video.url}
                  poster={d.proof.making_video.poster}
                  label={t("watch_making")}
                />
              </section>
            )}

            {/* Action Buttons */}
            <section className="flex flex-col gap-3">
              {d.piece.available ? (
                <Link
                  href={`/p/${d.piece.code}`}
                  className="flex min-h-12 items-center justify-center rounded-full bg-terracotta-800 px-6 font-medium text-white transition-all hover:bg-terracotta-900 active:scale-98 shadow-sm"
                >
                  {t("buy", { price: inr(d.piece.price_inr) })}
                </Link>
              ) : (
                <Link
                  href={`/p/${d.piece.code}`}
                  className="flex min-h-12 items-center justify-center rounded-full bg-terracotta-800 px-6 font-medium text-white transition-all hover:bg-terracotta-900 active:scale-98 shadow-sm"
                >
                  {t("request_again")}
                </Link>
              )}
              {maker && (
                <Link
                  href={`/m/${maker.handle}`}
                  className="flex min-h-12 items-center justify-center rounded-full border border-ink-800 bg-white px-6 font-medium text-ink-900 transition-colors hover:bg-ink-950 hover:text-white"
                >
                  {t("more_from", { name: firstName })}
                </Link>
              )}
            </section>
          </div>

          {/* Right Column: Master Artisan & Verification Chain */}
          <div className="flex flex-col gap-6">
            {/* The Maker */}
            <section className="rounded-[20px] border border-sand-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta-700">
                  {t("the_maker")}
                </h2>
                <span className="font-mono text-[11px] text-ink-500">Master Lineage</span>
              </div>

              {maker ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    {maker.photo_url ? (
                      <img
                        src={maker.photo_url}
                        alt=""
                        className="size-16 rounded-full object-cover ring-2 ring-sand-200 shadow-2xs"
                        loading="lazy"
                      />
                    ) : null}
                    <div>
                      <Link href={`/m/${maker.handle}`} className="font-serif text-xl font-medium text-ink-950 hover:text-terracotta-800 transition-colors">
                        {maker.name}
                      </Link>
                      <p className="text-sm text-ink-600">{maker.place}</p>
                      <p className="mt-1 text-xs font-semibold">
                        {maker.passport.state === "verified" ? (
                          <span className="text-peacock-700">✓ {t("passport_verified")}</span>
                        ) : (
                          <span className="text-ink-600">{t("passport_unverified")}</span>
                        )}
                        {maker.years_of_practice ? (
                          <span className="text-ink-500 font-normal"> · {t("years", { n: maker.years_of_practice })}</span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  {maker.voice_url && (
                    <VoiceClip url={maker.voice_url} label={t("listen", { name: firstName })} />
                  )}

                  {maker.story && (
                    <blockquote className="rounded-[14px] bg-[#FAF7F2] p-4 font-serif text-[15px] italic leading-relaxed text-ink-800" lang={maker.story_lang}>
                      “{maker.story}”
                    </blockquote>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink-600">{t("maker_under_review")}</p>
              )}
            </section>

            {/* The Physical Proof Checks */}
            {verified && (
              <section className="rounded-[20px] border border-sand-200/90 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="size-5 text-terracotta-800" />
                  <h2 className="font-serif text-xl font-medium text-ink-950">
                    {t("the_proof")}
                  </h2>
                </div>
                <ProofChecks checks={d.proof.checks} photosOriginal={d.proof.photos_original} registry={d.proof.registry} />
              </section>
            )}

            {d.verdict === "revoked" && (
              <p className="rounded-[16px] bg-white p-6 text-sm text-ink-600 border border-sand-200">
                {t("revoked_body", { date: d.proof.revoked_on || "" })}
              </p>
            )}

            {/* Unit's Journey */}
            <section className="rounded-[20px] border border-sand-200/90 bg-white p-6 shadow-xs">
              <h2 className="font-serif text-xl font-medium text-ink-950 mb-4">
                {t("journey")}
              </h2>
              <ol className="relative ms-3 border-s-2 border-sand-200/90">
                {d.journey.map((j, i) => (
                  <li key={i} className="mb-4 ms-5 last:mb-0">
                    <span className="absolute -start-[9px] mt-1.5 size-4 rounded-full border-2 border-white bg-terracotta-800" />
                    <p className="font-serif text-[15px] font-semibold text-ink-950">
                      {t(`event.${j.event}`, { city: j.city || "" })}
                    </p>
                    <p className="text-xs text-ink-500 font-mono mt-0.5">{j.date}</p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Market Context */}
            {d.market_context && (
              <div className="rounded-[16px] border border-peacock-200/70 bg-peacock-50/60 p-4 text-xs sm:text-sm text-peacock-800 font-serif">
                {t("market", { low: d.market_context.low, high: d.market_context.high })}
              </div>
            )}

            {/* Verification Footer & Report Button */}
            <footer className="flex flex-col items-center gap-3 pt-4 text-center">
              <ReportButton code={d.code} labels={{ link: t("report"), sent: t("report_sent"), prompt: t("report_prompt") }} />
              <Link href="/verification-explained" className="text-xs font-semibold text-terracotta-800 hover:underline inline-flex items-center gap-1">
                {t("how_it_works")} <ArrowRight className="size-3" />
              </Link>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}

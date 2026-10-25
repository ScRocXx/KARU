import { ArrowRight, BadgeCheck, CircleDashed, ShieldCheck, ShieldOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ProofChecks } from "@/components/karu/badges";
import { Woven } from "@/components/karu/ornaments";
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
    <div className="min-h-dvh bg-surface-alt text-ink-900 pb-16">
      <ScanBeacon type="karu_id" code={d.code} />

      {/* 1. Provenance Certificate Header */}
      <header className="bg-surface-deep text-khadi-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl font-medium tracking-wider text-khadi-100">karu</span>
            <span className="hidden sm:inline text-eyebrow text-gold-300 border-s border-white/20 ps-2.5">
              Certificate of Provenance
            </span>
          </Link>
          <LangLinks current={locale} />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-sand-300">
                Tamper-Evident ID · {d.code}
              </p>
              <div className="mt-2 flex items-center gap-2.5">
                {verified ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-peacock-700/90 border border-peacock-400/50 px-4 py-1.5 text-base sm:text-lg font-medium text-white shadow-xs">
                    <BadgeCheck className="size-5 text-gold-400" /> {t("verified")}
                  </span>
                ) : d.verdict === "revoked" ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-danger-800 px-4 py-1.5 text-base sm:text-lg font-medium text-white">
                    <ShieldOff className="size-5" /> {t("revoked")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-sand-700 px-4 py-1.5 text-base sm:text-lg font-medium text-white">
                    <CircleDashed className="size-5" /> {d.verdict === "checking" ? t("checking") : t("not_verified")}
                  </span>
                )}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-eyebrow text-gold-300">
                100% Physical Origin Checked
              </span>
              <p className="font-mono text-xs text-sand-300/80 mt-0.5">
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
          <div id="kid-sold-notice" className="mb-6 rounded-xs border border-gold-400/80 bg-gold-50 p-4 text-body-s font-medium text-gold-950">
            {t("sold_notice", { date: d.sold_on || "" })}
          </div>
        )}
        <OwnedByYou code={d.code} label={t("owned_by_you")} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Physical Piece & Video Evidence */}
          <div className="flex flex-col gap-6">
            {/* Piece Presentation Card */}
            <section className="overflow-hidden rounded-sm border border-line bg-surface shadow-xs">
              {d.piece.image?.card && (
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand-100">
                  <img
                    src={d.piece.image.card}
                    alt={d.piece.title}
                    className="size-full object-cover"
                    fetchPriority="high"
                  />
                  <div className="absolute end-3 bottom-3 rounded-xs border border-line bg-surface/90 px-3 py-1 font-mono text-caption uppercase tracking-wider text-ink-900 backdrop-blur-md">
                    ID #{d.code}
                  </div>
                </div>
              )}
              <div className="p-6">
                <p className="text-eyebrow text-brand">
                  {[d.piece.craft, d.piece.region].filter(Boolean).join(" · ")}
                </p>
                <h1 className="mt-1 font-serif text-h2 text-ink-900" lang={d.piece.title_lang}>
                  {d.piece.title}
                </h1>
              </div>
            </section>

            {/* Unedited Making Video (Verified only) */}
            {verified && d.proof.making_video && (
              <section className="rounded-sm border border-line bg-surface p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-h3 text-ink-900">
                    {t("watch_making")}
                  </h2>
                  <span className="rounded-full bg-verified-soft border border-peacock-200 px-2.5 py-0.5 text-caption font-semibold text-verified uppercase tracking-wider">
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
                  className="flex min-h-12 items-center justify-center rounded-xs bg-brand px-6 text-eyebrow text-on-dark transition-colors hover:bg-brand-hover shadow-xs"
                >
                  {t("buy", { price: inr(d.piece.price_inr) })}
                </Link>
              ) : (
                <Link
                  href={`/p/${d.piece.code}`}
                  className="flex min-h-12 items-center justify-center rounded-xs bg-brand px-6 text-eyebrow text-on-dark transition-colors hover:bg-brand-hover shadow-xs"
                >
                  {t("request_again")}
                </Link>
              )}
              {maker && (
                <Link
                  href={`/m/${maker.handle}`}
                  className="flex min-h-12 items-center justify-center rounded-xs border border-ink-900 bg-surface px-6 text-eyebrow text-ink-900 transition-colors hover:bg-surface-alt"
                >
                  {t("more_from", { name: firstName })}
                </Link>
              )}
            </section>
          </div>

          {/* Right Column: Master Artisan & Verification Chain */}
          <div className="flex flex-col gap-6">
            {/* The Maker */}
            <section className="rounded-sm border border-line bg-surface p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-eyebrow text-brand">
                  {t("the_maker")}
                </h2>
                <span className="font-mono text-caption text-muted">Master Lineage</span>
              </div>

              {maker ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    {maker.photo_url ? (
                      <div className="size-16 overflow-hidden rounded-t-full border border-gold-500/40 bg-sand-200">
                        <img
                          src={maker.photo_url}
                          alt=""
                          className="size-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    <div>
                      <Link href={`/m/${maker.handle}`} className="font-serif text-h3 text-ink-900 hover:text-brand transition-colors">
                        {maker.name}
                      </Link>
                      <p className="text-body-s text-muted">{maker.place}</p>
                    </div>
                  </div>

                  {maker.voice_url && (
                    <VoiceClip
                      url={maker.voice_url}
                      label={t("listen_maker", { name: firstName })}
                    />
                  )}

                  {maker.story && (
                    <blockquote className="border-s-2 border-brand ps-3 font-serif italic text-body-s text-ink-900" lang={maker.story_lang}>
                      "{maker.story}"
                    </blockquote>
                  )}
                </div>
              ) : (
                <p className="text-body-s text-muted">{t("maker_under_review")}</p>
              )}
            </section>

            {/* Proof of Origin */}
            <section className="rounded-sm border border-line bg-surface p-6 shadow-xs">
              <h2 className="font-serif text-h3 text-ink-900 mb-4">
                Provenance Checklist
              </h2>
              <ProofChecks checks={d.proof.checks} />
            </section>

            {/* Public Ledger Record */}
            <section className="rounded-sm border border-line bg-surface p-6 shadow-xs text-body-s">
              <h3 className="font-serif text-h4 text-ink-900 mb-3">Registry Metadata</h3>
              <dl className="grid grid-cols-2 gap-3 text-caption">
                <div>
                  <dt className="text-muted uppercase tracking-wider">Karu ID</dt>
                  <dd className="font-mono font-semibold text-brand text-body-s mt-0.5">{d.code}</dd>
                </div>
                <div>
                  <dt className="text-muted uppercase tracking-wider">Craft Family</dt>
                  <dd className="font-medium text-ink-900 mt-0.5">{d.piece.craft || "Handloom"}</dd>
                </div>
                <div>
                  <dt className="text-muted uppercase tracking-wider">Origin Cluster</dt>
                  <dd className="font-medium text-ink-900 mt-0.5">{d.piece.region}</dd>
                </div>
                <div>
                  <dt className="text-muted uppercase tracking-wider">Verification Date</dt>
                  <dd className="font-medium text-ink-900 mt-0.5">{d.verified_label || "Certified"}</dd>
                </div>
              </dl>
              <div className="mt-4 pt-4 border-t border-line flex items-center gap-3 bg-surface-alt p-3 rounded-xs">
                <img
                  src={`http://127.0.0.1:8000/api/v1/karu-ids/${d.code}/qr.png`}
                  alt={`QR Verification Code for Karu ID ${d.code}`}
                  className="size-16 rounded-xs border border-line bg-white p-1 shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-caption font-semibold text-ink-900">Physical Origin QR Tag</span>
                  <span className="text-[11px] text-muted">Scan to verify authentic certificate on the Karu public ledger</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                <ReportButton code={d.code} labels={{ link: t("report_fake"), sent: t("report_sent"), prompt: t("report_prompt") }} />
                <span className="text-[11px] font-mono text-muted">Immutable Ledger Entry</span>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, IndianRupee, Package, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { SellPage } from "@/components/artisan/shell";
import { AuthGate } from "@/components/auth-gate";
import { StockPill, VerifiedBadge } from "@/components/karu/badges";
import { SpeakerButton } from "@/components/karu/voice";
import { Banner, Button, Chip, EmptyState, Skeleton } from "@/components/ui";
import { speechTags, type Locale } from "@/i18n/config";
import { api } from "@/lib/api";
import { cx, inr } from "@/lib/format";
import { db, onOutboxChange, retryItem, type OutboxItem } from "@/lib/offline";
import { speak } from "@/lib/speech";
import type { ImageSet, Stock, VerificationStatus } from "@/lib/types";

interface Dashboard {
  greeting_name: string;
  summary: { views_today: number; orders_to_ship: number; money_on_the_way: string };
  banners: { key: string; count?: number; amount?: string; link: string }[];
  open_requests: number;
  profile_completion: number;
  profile_missing: string[];
  passport: { code: string; state: string };
  impact: { earned: string; pieces_sold: number; buyer_cities: number };
}

interface MyListing {
  id: string;
  code: string;
  status: string;
  title: string;
  price_inr: number | null;
  image: ImageSet | null;
  stock: Stock;
  quantity_total: number;
  verification: VerificationStatus;
  price_position: "below" | "in_range" | "above" | "unknown";
}

export default function SellHome() {
  return (
    <Suspense>
      <AuthGate require="artisan">{() => <Home />}</AuthGate>
    </Suspense>
  );
}

function Home() {
  const t = useTranslations("sell.home");
  const locale = useLocale() as Locale;
  const params = useSearchParams();
  const router = useRouter();
  const [filter, setFilter] = useState<string>(params.get("filter") || "all");
  const dash = useQuery({ queryKey: ["sell-dashboard"], queryFn: () => api<Dashboard>("/artisan/dashboard") });
  const listings = useQuery({ queryKey: ["my-listings"], queryFn: () => api<{ items: MyListing[] }>("/listings/mine") });
  const [drafts, setDrafts] = useState<OutboxItem[]>([]);
  const [hideCompletion, setHideCompletion] = useState(true);

  useEffect(() => {
    const load = () => void db().outbox.where("status").anyOf("pending", "uploading", "failed").toArray().then(setDrafts);
    load();
    return onOutboxChange(load);
  }, []);
  useEffect(() => {
    // Profile completion nudge: at most once per session, dismissible (Part 1 §4.1).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading session storage after mount
    setHideCompletion(sessionStorage.getItem("karu:completion-dismissed") === "1");
  }, []);
  useEffect(() => {
    if (params.get("welcome") === "1") {
      speak([t("tour_1"), t("tour_2"), t("tour_3")].join(" "), speechTags[locale]);
      router.replace("/sell");
    }
  }, [params, router, t, locale]);

  const d = dash.data;
  const items = (listings.data?.items || []).filter((l) =>
    filter === "all" ? true : filter === "not_verified" ? l.verification !== "verified" && l.status === "published" : filter === "drafts" ? l.status === "draft" || l.status === "processing" : l.status === filter,
  );

  return (
    <SellPage>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-ink-600">{t("greeting")}</p>
          <h1 className="font-display text-[28px] leading-tight">{d?.greeting_name || "…"}</h1>
        </div>
        <SpeakerButton text={t("speak_summary", { orders: d?.summary.orders_to_ship ?? 0, money: d?.summary.money_on_the_way ?? "" })} />
      </div>

      {dash.isLoading ? (
        <Skeleton className="h-24" />
      ) : d ? (
        <div className="grid grid-cols-3 gap-2">
          <Summary icon={<Eye className="size-5" />} value={String(d.summary.views_today)} label={t("views_today")} />
          <Summary icon={<Package className="size-5" />} value={String(d.summary.orders_to_ship)} label={t("to_ship")} href="/sell/orders" highlight={d.summary.orders_to_ship > 0} />
          <Summary icon={<IndianRupee className="size-5" />} value={d.summary.money_on_the_way} label={t("on_the_way")} href="/sell/payouts" />
        </div>
      ) : null}

      {d?.banners.map((b) => (
        <Link key={b.key} href={b.link}>
          <Banner tone={b.key === "orders_to_ship" ? "warn" : "info"} action={<span className="flip-rtl text-xl">→</span>}>
            {t(`banner.${b.key}`, { n: b.count ?? 0, amount: b.amount ?? "" })}
          </Banner>
        </Link>
      ))}

      {d && d.profile_completion < 100 && !hideCompletion && (
        <div className="flex items-center gap-3 rounded-[12px] border border-ink-100 bg-white p-4">
          <div className="flex-1">
            <p className="font-semibold">{t("completion", { pct: d.profile_completion })}</p>
            {d.profile_missing[0] && (
              <Link href="/sell/passport" className="text-[15px] font-semibold text-indigo-900 underline">
                {t(`missing.${d.profile_missing[0]}`)}
              </Link>
            )}
          </div>
          <button
            className="tap flex items-center justify-center rounded-full hover:bg-ink-100"
            aria-label={t("dismiss")}
            onClick={() => {
              sessionStorage.setItem("karu:completion-dismissed", "1");
              setHideCompletion(true);
            }}
          >
            <X className="size-5" />
          </button>
        </div>
      )}

      {drafts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">{t("saved_on_phone")}</h2>
          {drafts.map((dr) => (
            <div key={dr.id} className="flex items-center gap-3 rounded-[12px] border border-dashed border-ink-300 bg-white p-3">
              <span className="flex-1 text-[15px]">{t(dr.status === "failed" ? "draft_failed" : "draft_waiting", { n: dr.photos.length })}</span>
              {dr.status === "failed" && <Button size="S" onClick={() => void retryItem(dr.id!)}>{t("retry")}</Button>}
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">{t("products")}</h2>
          <Link href="/sell/new" className="inline-flex min-h-11 items-center gap-1 rounded-full bg-indigo-900 px-4 font-semibold text-white">
            <Plus className="size-5" /> {t("new")}
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {["all", "published", "not_verified", "drafts", "paused"].map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{t(`filter.${f}`)}</Chip>
          ))}
        </div>
        {listings.isLoading ? (
          <Skeleton className="h-48" />
        ) : !listings.data?.items.length ? (
          <EmptyState art="loom" title={t("empty_title")} body={t("empty_body")} action={<Link href="/sell/new" className="inline-flex min-h-12 items-center gap-2 rounded-[10px] bg-indigo-900 px-5 font-semibold text-white"><Plus className="size-5" /> {t("add_first")}</Link>} />
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((l) => (
              <li key={l.id}>
                <Link href={l.status === "draft" || l.status === "processing" ? `/sell/new?listing=${l.id}` : `/sell/products/${l.id}`} className="flex gap-3 rounded-[14px] border border-ink-100 bg-white p-3 hover:border-indigo-900/30">
                  <div className="aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-[10px] bg-ink-100">{l.image?.thumb && <img src={l.image.thumb} alt="" className="size-full object-cover" />}</div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="line-clamp-2 font-semibold leading-snug">{l.title || t("untitled")}</p>
                    <p className="flex items-center gap-2 text-[15px]">
                      <span className="font-semibold">{inr(l.price_inr)}</span>
                      <PriceDot position={l.price_position} />
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {l.status === "published" || l.status === "paused" ? <VerifiedBadge status={l.verification} /> : <span className="rounded-full bg-haldi-100 px-2 py-0.5 text-xs font-semibold">{t(`status.${l.status}`)}</span>}
                      {l.status === "published" && <StockPill stock={l.stock} />}
                      {l.status === "paused" && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold">{t("status.paused")}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {d && d.impact.pieces_sold > 0 && (
        <section className="rounded-[16px] bg-indigo-900 p-5 text-white">
          <p className="text-sm text-white/80">{t("your_impact")}</p>
          <p className="font-display text-3xl">{d.impact.earned}</p>
          <p className="text-white/85">{t("impact_line", { pieces: d.impact.pieces_sold, cities: d.impact.buyer_cities })}</p>
        </section>
      )}
    </SellPage>
  );
}

function Summary({ icon, value, label, href, highlight }: { icon: React.ReactNode; value: string; label: string; href?: string; highlight?: boolean }) {
  const body = (
    <div className={cx("flex h-full flex-col gap-1 rounded-[14px] border bg-white p-3", highlight ? "border-terracotta-600" : "border-ink-100")}>
      <span className="text-indigo-900">{icon}</span>
      <span className="truncate text-xl font-semibold">{value}</span>
      <span className="text-xs leading-tight text-ink-600">{label}</span>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** Price-advice dot: green in range / amber below range / grey no data (Part 1 §4.1). */
function PriceDot({ position }: { position: MyListing["price_position"] }) {
  const t = useTranslations("sell.home");
  const color = position === "in_range" ? "bg-peacock-600" : position === "below" ? "bg-haldi-500" : position === "above" ? "bg-indigo-700" : "bg-ink-300";
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-600">
      <span className={cx("size-2.5 rounded-full", color)} aria-hidden /> {t(`price.${position}`)}
    </span>
  );
}

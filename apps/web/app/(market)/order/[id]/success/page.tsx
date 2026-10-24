"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Download, QrCode, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import { KaruIdChip } from "@/components/karu/badges";
import { Emblem } from "@/components/karu/ornaments";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Stepper } from "@/components/ui/stepper";
import { api } from "@/lib/api";
import { date, inr } from "@/lib/format";
import type { OrderView } from "@/components/market/order-types";

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <Success id={id} />}</AuthGate>;
}

function Success({ id }: { id: string }) {
  const t = useTranslations("success");
  const locale = useLocale();

  const { data: order } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api<OrderView>(`/orders/${id}`),
    refetchInterval: (q) => (q.state.data?.status === "pending_payment" ? 2000 : false),
  });

  if (!order) {
    return (
      <div className="container-prose py-16">
        <CardSkeleton />
      </div>
    );
  }

  if (order.status === "pending_payment") {
    return (
      <div className="container-prose py-24 text-center">
        <p className="font-serif text-h3 text-ink-900">{t("confirming") || "Confirming payment with banking network..."}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface-alt min-h-[85vh] py-12 lg:py-16">
      <div className="container-prose mx-auto flex flex-col gap-8">
        {/* Success Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <Emblem className="size-16 text-brand/20 animate-spin-slow" />
            <CheckCircle2 className="animate-settle absolute inset-0 m-auto size-10 text-verified" />
          </div>

          <h1 className="font-serif text-display text-ink-900 mt-2">
            Thank you. Your order is with the makers.
          </h1>

          <p className="text-body-s text-muted">
            Order #{order.order_number} · {inr(order.total_inr)} · {date(order.created_at, locale)}
          </p>
        </div>

        {/* What Happens Next Stepper */}
        <div className="rounded-sm border border-line bg-surface p-6 shadow-xs">
          <h2 className="text-eyebrow text-brand mb-4">What happens next</h2>
          <Stepper
            currentStep={1}
            steps={[
              { title: "Artisan notified", description: "Direct payment credited" },
              { title: "Physical tagging", description: "Unique Karu ID attached" },
              { title: "Dispatched", description: "Tracking details shared via SMS" },
            ]}
          />
        </div>

        {/* Karu ID Cards per Piece */}
        <div className="flex flex-col gap-4">
          <h2 className="text-eyebrow text-ink-900">Your Handcrafted Pieces & Karu IDs</h2>

          {order.items.map((it) => (
            <article
              key={it.id}
              className="rounded-sm border border-line bg-surface p-5 shadow-xs flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              {it.image?.card && (
                <div className="size-24 shrink-0 overflow-hidden rounded-xs border border-line bg-sand-100">
                  <img src={it.image.card} alt="" className="h-full w-full object-cover" />
                </div>
              )}

              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <h3 className="font-serif text-h4 text-ink-900 truncate">{it.title}</h3>
                <p className="text-caption text-muted">Crafted by {it.maker.name}</p>

                {it.karu_id ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    <KaruIdChip code={it.karu_id} />
                    <span className="text-[11px] text-muted">Scan the tag when it arrives</span>
                  </div>
                ) : (
                  <p className="text-caption text-danger">Item refunded</p>
                )}
              </div>

              {it.karu_id && (
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <Link href={`/k/${it.karu_id}`}>
                    <Button variant="secondary" size="S" block>
                      View certificate
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="S"
                    icon={<Download className="size-3.5" />}
                    onClick={() => storyCard(it, `Handcrafted by ${it.maker.name}`)}
                  >
                    Story card
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-line">
          <Link href={`/account/orders/${order.id}`}>
            <Button variant="primary" size="L">
              Track this order
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" size="L">
              Continue exploring
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Render shareable story card directly onto canvas */
async function storyCard(it: OrderView["items"][number], line: string) {
  const W = 1080;
  const H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#FAF7F2";
  ctx.fillRect(0, 0, W, H);

  if (it.image?.large) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = it.image.large;
    await new Promise((r) => {
      img.onload = r;
      img.onerror = r;
    });
    if (img.naturalWidth) ctx.drawImage(img, 0, 0, W, 960);
  }

  ctx.fillStyle = "#1E251E";
  ctx.fillRect(0, 960, W, 390);
  ctx.fillStyle = "#D4A338";
  for (let x = 0; x < W; x += 14) ctx.fillRect(x, 960, 8, 6);

  ctx.fillStyle = "#FAF7F2";
  ctx.font = "500 44px Georgia, serif";
  ctx.fillText("karu", 56, 1040);
  ctx.font = "500 46px Georgia, serif";
  ctx.fillText(it.title.slice(0, 38), 56, 1120);
  ctx.font = "28px sans-serif";
  ctx.fillStyle = "#EDE7DC";
  ctx.fillText(line, 56, 1180);
  if (it.karu_id) {
    ctx.font = "600 32px monospace";
    ctx.fillStyle = "#D4A338";
    ctx.fillText(`Karu ID: ${it.karu_id}`, 56, 1260);
  }

  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `karu-story-${it.karu_id || "card"}.png`;
  a.click();
}

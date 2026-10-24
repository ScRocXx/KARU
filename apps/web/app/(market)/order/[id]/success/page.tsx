"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Download, QrCode } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import { Button, Card, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { date, inr } from "@/lib/format";
import type { OrderView } from "@/components/market/order-types";

/** B10: order number, the Karu ID(s) to expect, and a story card to save or share. */
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
    // The webhook may land a moment after the checkout closes.
    refetchInterval: (q) => (q.state.data?.status === "pending_payment" ? 2000 : false),
  });
  if (!order) return <Skeleton className="mt-6 h-80" />;
  if (order.status === "pending_payment") return <p className="py-20 text-center text-ink-600">{t("confirming")}</p>;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pt-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="animate-settle size-14 text-peacock-600" />
        <h1 className="font-display text-3xl">{t("title")}</h1>
        <p className="text-ink-600">{t("order_number", { n: order.order_number })} · {inr(order.total_inr)} · {date(order.created_at, locale)}</p>
      </div>
      {order.items.map((it) => (
        <Card key={it.id} className="flex flex-col gap-4 p-4 sm:flex-row">
          {it.image?.card && <img src={it.image.card} alt="" className="aspect-[4/5] w-full rounded-[10px] object-cover sm:w-36" />}
          <div className="flex flex-1 flex-col gap-2">
            <p className="font-display text-xl">{it.title}</p>
            <p className="text-sm text-ink-600">{t("by", { maker: it.maker.name })}</p>
            {it.karu_id ? (
              <p className="flex items-center gap-2 rounded-[10px] bg-indigo-50 p-3 text-[15px] text-indigo-900">
                <QrCode className="size-5 shrink-0" />
                <span>{t("karu_id", { id: it.karu_id })}</span>
              </p>
            ) : (
              <p className="text-sm text-terracotta-600">{t("refunded_item")}</p>
            )}
            {it.karu_id && (
              <div className="flex flex-wrap gap-2">
                <Link href={`/k/${it.karu_id}`} className="font-semibold text-indigo-900 underline">{t("see_proof")}</Link>
                <Button size="S" variant="secondary" icon={<Download className="size-4" />} onClick={() => storyCard(it, t("story_card_line", { maker: it.maker.name }))}>
                  {t("story_card")}
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
      <div className="flex justify-center gap-3">
        <Link href={`/account/orders/${order.id}`} className="rounded-[10px] bg-indigo-900 px-5 py-3 font-semibold text-white">{t("track")}</Link>
        <Link href="/" className="rounded-[10px] border-2 border-indigo-900 px-5 py-3 font-semibold text-indigo-900">{t("continue")}</Link>
      </div>
    </div>
  );
}

/** Gift / story card: product photo, maker, Karu ID, short line — rendered on device. */
async function storyCard(it: OrderView["items"][number], line: string) {
  const W = 1080;
  const H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#FBF8F2";
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
  ctx.fillStyle = "#1F2A6B";
  ctx.fillRect(0, 960, W, 390);
  ctx.fillStyle = "#E3A72F";
  for (let x = 0; x < W; x += 14) ctx.fillRect(x, 960, 8, 6);
  ctx.fillStyle = "#fff";
  ctx.font = "600 44px Georgia, serif";
  ctx.fillText("karu", 56, 1040);
  ctx.font = "600 46px Georgia, serif";
  ctx.fillText(it.title.slice(0, 38), 56, 1120);
  ctx.font = "30px sans-serif";
  ctx.fillText(line.slice(0, 60), 56, 1175);
  ctx.font = "600 32px monospace";
  ctx.fillStyle = "#E3A72F";
  ctx.fillText(it.karu_id || "", 56, 1250);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `karu-${it.karu_id}.png`;
  a.click();
}

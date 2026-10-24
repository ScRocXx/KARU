"use client";

import { useQuery } from "@tanstack/react-query";
import { QrCode } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import type { OrderItemView, OrderView } from "@/components/market/order-types";
import { useToast } from "@/components/toast";
import { Banner, Button, Card, Field, Select, Sheet, Skeleton, Stars, Stepper, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { date, inr } from "@/lib/format";
import { uploadPhoto } from "@/lib/media";

/** B12: status timeline, received / not received, return request (F8), review prompt (B17). */
export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <OrderDetail id={id} />}</AuthGate>;
}

function OrderDetail({ id }: { id: string }) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const { data: order, refetch } = useQuery({ queryKey: ["order", id], queryFn: () => api<OrderView>(`/orders/${id}`) });
  if (!order) return <Skeleton className="mt-6 h-96" />;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pt-6">
      <div>
        <h1 className="font-display text-[26px]">{t("order", { n: order.order_number })}</h1>
        <p className="text-ink-600">{date(order.created_at, locale)} · {inr(order.total_inr)} · {order.payment?.method ? t(`method.${order.payment.method}`) : ""}</p>
      </div>
      {order.items.map((it) => (
        <ItemCard key={it.id} orderId={order.id} item={it} onChange={() => refetch()} />
      ))}
      <Card className="p-4 text-sm">
        <p className="mb-1 font-semibold">{t("deliver_to")}</p>
        <p>{order.address.name} · {order.address.phone}</p>
        <p className="text-ink-600">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city}, {order.address.state} {order.address.pin}</p>
      </Card>
    </div>
  );
}

function ItemCard({ orderId, item, onChange }: { orderId: string; item: OrderItemView; onChange: () => void }) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const toast = useToast();
  const [returnOpen, setReturnOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const order = ["to_pack", "shipped", "delivered"];
  const idx = order.indexOf(item.status);
  const steps = [
    { label: t("timeline.paid"), state: "done" as const },
    { label: t("timeline.packing"), state: idx > 0 ? ("done" as const) : idx === 0 ? ("current" as const) : ("todo" as const) },
    {
      label: t("timeline.shipped"),
      state: idx > 1 ? ("done" as const) : idx === 1 ? ("current" as const) : ("todo" as const),
      detail: item.shipped_at ? `${date(item.shipped_at, locale)}${item.courier ? ` · ${item.courier}` : ""}${item.tracking_no ? ` · ${item.tracking_no}` : ""}` : undefined,
    },
    { label: t("timeline.delivered"), state: idx === 2 ? ("done" as const) : ("todo" as const), detail: item.delivered_at ? date(item.delivered_at, locale) : undefined },
  ];
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex gap-3">
        {item.image?.thumb && <img src={item.image.thumb} alt="" className="aspect-[4/5] w-20 rounded-[8px] object-cover" />}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link href={item.code ? `/p/${item.code}` : "#"} className="font-semibold">{item.title}</Link>
          <p className="text-sm text-ink-600">{item.maker.name} · {inr(item.price_inr)}</p>
          {item.karu_id && (
            <Link href={`/k/${item.karu_id}`} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-indigo-900 underline">
              <QrCode className="size-4" /> {item.karu_id}
            </Link>
          )}
        </div>
      </div>
      {item.status === "cancelled" || item.status === "returned" || item.status === "return_requested" ? (
        <Banner tone="info">
          {t(`status.${item.status}`)}
          {item.refund ? ` · ${t("refund", { status: t(`refund_status.${item.refund.status}`), amount: inr(item.refund.amount_inr) })}` : ""}
        </Banner>
      ) : (
        <Stepper steps={steps} />
      )}
      <div className="flex flex-wrap gap-2">
        {item.can_confirm_received && (
          <>
            <Button
              size="S"
              onClick={async () => {
                await api(`/orders/${orderId}/items/${item.id}/received`, { method: "POST" });
                toast(t("thanks_received"));
                onChange();
              }}
            >
              {t("received")}
            </Button>
            <Button
              size="S"
              variant="tertiary"
              onClick={async () => {
                await api(`/orders/${orderId}/items/${item.id}/not-received`, { method: "POST", body: {} });
                toast(t("dispute_sent"), "info");
              }}
            >
              {t("not_received")}
            </Button>
          </>
        )}
        {item.can_review && <Button size="S" variant="secondary" onClick={() => setReviewOpen(true)}>{t("write_review")}</Button>}
        {item.can_return && <Button size="S" variant="tertiary" onClick={() => setReturnOpen(true)}>{t("return")}</Button>}
        {!item.returnable && item.status === "delivered" && <span className="text-sm text-ink-600">{t("not_returnable")}</span>}
        {item.return_window_ends_at && item.can_return && <span className="self-center text-xs text-ink-600">{t("return_until", { date: date(item.return_window_ends_at, locale) })}</span>}
      </div>
      <ReturnSheet open={returnOpen} onClose={() => setReturnOpen(false)} orderId={orderId} itemId={item.id} onDone={onChange} />
      <ReviewSheet open={reviewOpen} onClose={() => setReviewOpen(false)} itemId={item.id} onDone={onChange} />
    </Card>
  );
}

function ReturnSheet({ open, onClose, orderId, itemId, onDone }: { open: boolean; onClose: () => void; orderId: string; itemId: string; onDone: () => void }) {
  const t = useTranslations("orders");
  const [reason, setReason] = useState("not_as_described");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title={t("return")}>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api(`/orders/${orderId}/items/${itemId}/return`, { method: "POST", body: { reason, details: details || null, photo_media_ids: photos } });
            onDone();
            onClose();
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label={t("return_reason")} htmlFor="rt-r">
          <Select id="rt-r" value={reason} onChange={(e) => setReason(e.target.value)}>
            {["not_as_described", "damaged", "changed_mind", "other"].map((r) => (
              <option key={r} value={r}>{t(`reasons.${r}`)}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("details")} htmlFor="rt-d">
          <Textarea id="rt-d" value={details} onChange={(e) => setDetails(e.target.value)} />
        </Field>
        <Field label={t("photos")}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files || []).slice(0, 4);
              setBusy(true);
              try {
                setPhotos(await Promise.all(files.map((f) => uploadPhoto(f))));
              } finally {
                setBusy(false);
              }
            }}
          />
        </Field>
        <p className="text-sm text-ink-600">{t("return_note")}</p>
        <Button type="submit" loading={busy}>{t("request_return")}</Button>
      </form>
    </Sheet>
  );
}

/** B17: stars, text, optional photo. Verified purchasers only (server enforces). */
function ReviewSheet({ open, onClose, itemId, onDone }: { open: boolean; onClose: () => void; itemId: string; onDone: () => void }) {
  const t = useTranslations("orders");
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title={t("write_review")}>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/reviews", { method: "POST", body: { order_item_id: itemId, rating, text: text || null, photo_media_ids: photos } });
            toast(t("review_thanks"));
            onDone();
            onClose();
          } finally {
            setBusy(false);
          }
        }}
      >
        <Stars value={rating} onChange={setRating} size={32} label={t("rating")} />
        <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder={t("review_placeholder")} />
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            try {
              setPhotos([await uploadPhoto(f)]);
            } finally {
              setBusy(false);
            }
          }}
        />
        <Button type="submit" loading={busy}>{t("submit_review")}</Button>
      </form>
    </Sheet>
  );
}

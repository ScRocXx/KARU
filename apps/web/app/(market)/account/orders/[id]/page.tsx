"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Package, QrCode, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AuthGate } from "@/components/auth-gate";
import { KaruIdChip } from "@/components/karu/badges";
import type { OrderItemView, OrderView } from "@/components/market/order-types";
import { useToast } from "@/components/toast";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Stars } from "@/components/ui/stars";
import { Stepper } from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { date, inr } from "@/lib/format";
import { uploadPhoto } from "@/lib/media";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <OrderDetail id={id} />}</AuthGate>;
}

function OrderDetail({ id }: { id: string }) {
  const t = useTranslations("orders");
  const locale = useLocale();

  const { data: order, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api<OrderView>(`/orders/${id}`),
  });

  if (!order) return <CardSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1 border-b border-line pb-4">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-caption text-brand hover:underline mb-2"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to all orders</span>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-h2 text-ink-900">
            Order #{order.order_number}
          </h1>
          <span className="rounded-full bg-verified-soft px-3 py-1 text-caption font-semibold text-verified uppercase tracking-wider">
            {order.status.replace("_", " ")}
          </span>
        </div>

        <p className="text-body-s text-muted">
          Placed on {date(order.created_at, locale)} · {inr(order.total_inr)} · {order.payment?.method ? t(`method.${order.payment.method}`) : "Prepaid"}
        </p>
      </div>

      {/* 8/4 Grid Split */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* 8 cols Items & Timeline */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {order.items.map((it) => (
            <ItemCard key={it.id} orderId={order.id} item={it} onChange={() => refetch()} />
          ))}
        </div>

        {/* 4 cols Address & Payment Summary */}
        <aside className="lg:col-span-4 flex flex-col gap-5 lg:sticky lg:top-28">
          <div className="rounded-sm border border-line bg-surface p-5 shadow-xs">
            <h2 className="font-serif text-h4 text-ink-900 border-b border-line pb-2.5 mb-3">
              Delivery Address
            </h2>
            <p className="font-medium text-body-s text-ink-900">{order.address.name}</p>
            <p className="text-caption text-muted">{order.address.phone}</p>
            <p className="text-caption text-ink-800 mt-2 leading-relaxed">
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city}, {order.address.state} {order.address.pin}
            </p>
          </div>

          <div className="rounded-sm border border-line bg-surface p-5 shadow-xs">
            <h2 className="font-serif text-h4 text-ink-900 border-b border-line pb-2.5 mb-3">
              Payment Summary
            </h2>
            <dl className="flex flex-col gap-2 text-body-s">
              <div className="flex justify-between">
                <dt className="text-muted">Item Subtotal</dt>
                <dd className="font-medium text-ink-900">{inr(order.total_inr)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Standard Shipping</dt>
                <dd className="font-medium text-verified">Free</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold text-ink-900">
                <dt>Total Paid</dt>
                <dd className="font-serif text-brand">{inr(order.total_inr)}</dd>
              </div>
            </dl>
            <div className="mt-4 pt-3 border-t border-line text-[11px] text-muted flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-verified" />
              <span>Full artisan transfer verified via Karu ledger</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ItemCard({ orderId, item, onChange }: { orderId: string; item: OrderItemView; onChange: () => void }) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const toast = useToast();
  const [returnOpen, setReturnOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const orderStatuses = ["to_pack", "shipped", "delivered"];
  const idx = orderStatuses.indexOf(item.status);

  const steps = [
    { title: t("timeline.paid") || "Paid", description: "Maker notified" },
    {
      title: t("timeline.packing") || "Packing",
      description: idx > 0 ? "Tag attached" : idx === 0 ? "In workshop" : "Pending",
    },
    {
      title: t("timeline.shipped") || "Shipped",
      description: item.shipped_at
        ? `${date(item.shipped_at, locale)}${item.courier ? ` · ${item.courier}` : ""}`
        : "Express dispatch",
    },
    {
      title: t("timeline.delivered") || "Delivered",
      description: item.delivered_at ? date(item.delivered_at, locale) : "At your doorstep",
    },
  ];

  return (
    <article className="rounded-sm border border-line bg-surface p-5 shadow-xs flex flex-col gap-4">
      <div className="flex gap-4">
        {item.image?.thumb && (
          <img src={item.image.thumb} alt="" className="size-20 rounded-xs border border-line object-cover shrink-0" />
        )}
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <Link href={item.code ? `/p/${item.code}` : "#"} className="font-serif text-body font-medium text-ink-900 hover:text-brand truncate">
            {item.title}
          </Link>
          <p className="text-caption text-muted">
            By {item.maker.name} · {inr(item.price_inr)}
          </p>
          {item.karu_id && (
            <div className="mt-1">
              <KaruIdChip code={item.karu_id} />
            </div>
          )}
        </div>
      </div>

      {item.status === "cancelled" || item.status === "returned" || item.status === "return_requested" ? (
        <Banner tone="info">
          {t(`status.${item.status}`)}
          {item.refund ? ` · ${t("refund", { status: t(`refund_status.${item.refund.status}`), amount: inr(item.refund.amount_inr) })}` : ""}
        </Banner>
      ) : (
        <div className="py-2 border-y border-line">
          <Stepper currentStep={Math.max(0, idx + 1)} steps={steps} />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {item.can_confirm_received && (
          <>
            <Button
              size="S"
              variant="primary"
              onClick={async () => {
                await api(`/orders/${orderId}/items/${item.id}/received`, { method: "POST" });
                toast(t("thanks_received") || "Confirmed delivery");
                onChange();
              }}
            >
              {t("received") || "I have received this"}
            </Button>
            <Button
              size="S"
              variant="ghost"
              onClick={async () => {
                await api(`/orders/${orderId}/items/${item.id}/not-received`, { method: "POST", body: {} });
                toast(t("dispute_sent") || "Dispute submitted to Karu team", "info");
              }}
            >
              {t("not_received") || "Not received"}
            </Button>
          </>
        )}
        {item.can_review && (
          <Button size="S" variant="secondary" onClick={() => setReviewOpen(true)}>
            {t("write_review") || "Write a review"}
          </Button>
        )}
        {item.can_return && (
          <Button size="S" variant="ghost" onClick={() => setReturnOpen(true)}>
            {t("return") || "Request return"}
          </Button>
        )}
      </div>

      <ReturnDrawer open={returnOpen} onClose={() => setReturnOpen(false)} orderId={orderId} itemId={item.id} onDone={onChange} />
      <ReviewDrawer open={reviewOpen} onClose={() => setReviewOpen(false)} itemId={item.id} onDone={onChange} />
    </article>
  );
}

function ReturnDrawer({ open, onClose, orderId, itemId, onDone }: { open: boolean; onClose: () => void; orderId: string; itemId: string; onDone: () => void }) {
  const t = useTranslations("orders");
  const [reason, setReason] = useState("not_as_described");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  return (
    <Drawer open={open} onClose={onClose} title={t("return") || "Request a Return"} side="end">
      <form
        className="flex flex-col gap-4 py-2"
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
        <Field label={t("return_reason") || "Reason"}>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {["not_as_described", "damaged", "changed_mind", "other"].map((r) => (
              <option key={r} value={r}>{t(`reasons.${r}`) || r}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("details") || "Additional Details"}>
          <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} />
        </Field>
        <Button type="submit" variant="primary" size="L" block loading={busy}>
          {t("request_return") || "Submit return request"}
        </Button>
      </form>
    </Drawer>
  );
}

function ReviewDrawer({ open, onClose, itemId, onDone }: { open: boolean; onClose: () => void; itemId: string; onDone: () => void }) {
  const t = useTranslations("orders");
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  return (
    <Drawer open={open} onClose={onClose} title={t("write_review") || "Review Handcrafted Piece"} side="end">
      <form
        className="flex flex-col gap-5 py-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/reviews", { method: "POST", body: { order_item_id: itemId, rating, text: text || null, photo_media_ids: photos } });
            toast(t("review_thanks") || "Thank you for supporting this artisan!");
            onDone();
            onClose();
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <label className="text-body-s font-medium text-ink-900 block mb-2">Overall Rating</label>
          <Stars value={rating} onChange={setRating} size={32} />
        </div>
        <Field label="Your Experience with this Craft">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={4} placeholder="Describe the texture, weave, weight, and authenticity..." />
        </Field>
        <Button type="submit" variant="primary" size="L" block loading={busy}>
          {t("submit_review") || "Submit verified review"}
        </Button>
      </form>
    </Drawer>
  );
}

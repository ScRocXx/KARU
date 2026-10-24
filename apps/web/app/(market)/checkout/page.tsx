"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, CreditCard, Globe2, Landmark, Lock, Plus, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { AddressForm, type Address } from "@/components/market/address-form";
import { useToast } from "@/components/toast";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { RadioCard } from "@/components/ui/checkbox";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Stepper } from "@/components/ui/stepper";
import { ApiError, api } from "@/lib/api";
import { cx, inr } from "@/lib/format";
import { usePublicConfig } from "@/lib/hooks";
import type { Card as ProductCardT, Me } from "@/lib/types";

interface PlaceOrder {
  order_id: string;
  order_number: string;
  amount_paise: number;
  provider: "razorpay" | "fake";
  key_id: string;
  rzp_order_id: string;
  reserved_until: string | null;
}

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <AuthGate>{(me) => <Checkout me={me} />}</AuthGate>
    </Suspense>
  );
}

function Checkout({ me }: { me: Me }) {
  const t = useTranslations("checkout");
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const buyNow = params.get("buy_now");
  const { data: config } = usePublicConfig();

  const addresses = useQuery({ queryKey: ["addresses"], queryFn: () => api<{ items: Address[] }>("/addresses") });
  const cart = useQuery({
    queryKey: ["cart", "full"],
    queryFn: () =>
      api<{
        groups: { maker: ProductCardT["maker"]; items: { listing_id: string; qty: number; card: ProductCardT; available: boolean; line_total: number }[] }[];
        subtotal_inr: number;
        count: number;
      }>("/cart/items"),
    enabled: !buyNow,
  });

  const single = useQuery({
    queryKey: ["buy-now", buyNow],
    queryFn: async () => {
      const res = await api<{ items: ProductCardT[] }>(`/catalog/cards?ids=${buyNow}`);
      return res.items[0] || null;
    },
    enabled: !!buyNow,
  });

  const [addressId, setAddressId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fakeOrder, setFakeOrder] = useState<PlaceOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const [idemKey] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  );

  const chosen = addressId || addresses.data?.items.find((a) => a.is_default)?.id || addresses.data?.items[0]?.id || null;

  const lines = buyNow
    ? single.data
      ? [{ maker: single.data.maker, title: single.data.title, price: single.data.price_inr || 0, qty: 1, image: single.data.image?.thumb }]
      : []
    : (cart.data?.groups || []).flatMap((g) =>
        g.items.filter((i) => i.available).map((i) => ({ maker: g.maker, title: i.card.title, price: i.card.price_inr || 0, qty: i.qty, image: i.card.image?.thumb }))
      );

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  // Group items by maker for the "Who gets paid" breakdown
  const makerPayouts = lines.reduce((acc, l) => {
    const key = l.maker.handle || l.maker.name || "maker";
    if (!acc[key]) acc[key] = { name: l.maker.name, amount: 0, items: 0 };
    acc[key].amount += l.price * l.qty;
    acc[key].items += l.qty;
    return acc;
  }, {} as Record<string, { name: string; amount: number; items: number }>);

  const success = async (orderId: string) => {
    await qc.invalidateQueries({ queryKey: ["cart"] });
    router.replace(`/order/${orderId}/success`);
  };

  const pay = async () => {
    if (!chosen) return setError(t("need_address"));
    setBusy(true);
    setError(null);
    try {
      const order = await api<PlaceOrder>("/orders", {
        method: "POST",
        body: buyNow ? { address_id: chosen, buy_now: { listing_id: buyNow, qty: 1 } } : { address_id: chosen },
        headers: { "Idempotency-Key": idemKey },
      });
      if (order.provider === "fake") {
        setFakeOrder(order);
        setBusy(false);
        return;
      }
      if (!window.Razorpay) throw new Error("razorpay_not_loaded");
      const rzp = new window.Razorpay({
        key: order.key_id,
        order_id: order.rzp_order_id,
        amount: order.amount_paise,
        currency: "INR",
        name: "Karu",
        description: order.order_number,
        prefill: { name: me.display_name || "", email: me.email || "", contact: "" },
        theme: { color: "#8C3B1E" },
        config: {
          display: {
            blocks: { upi: { name: t("upi_block"), instruments: [{ method: "upi" }] } },
            sequence: ["block.upi"],
            preferences: { show_default_blocks: true },
          },
        },
        handler: async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            await api(`/orders/${order.order_id}/payment/verify`, { method: "POST", body: r });
            await success(order.order_id);
          } catch {
            await success(order.order_id);
          }
        },
        modal: { ondismiss: () => toast(t("payment_dismissed"), "info") },
      });
      rzp.on("payment.failed", () => toast(t("payment_failed"), "error"));
      rzp.open();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "unknown";
      setError(code === "just_sold_out" ? t("just_sold_out") : t("error"));
    } finally {
      setBusy(false);
    }
  };

  if (addresses.isLoading || (buyNow ? single.isLoading : cart.isLoading)) {
    return (
      <div className="container-page py-10">
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="container-page py-6 lg:py-10">
      {config?.providers.payments === "razorpay" && (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      )}

      {/* Stepper Header */}
      <div className="mb-8">
        <Stepper
          currentStep={1}
          steps={[
            { title: "Delivery address", description: "Where to ship" },
            { title: "Payment", description: "Direct maker payout" },
            { title: "Karu ID issued", description: "Tamper-evident verification" },
          ]}
        />
      </div>

      {/* Mobile Collapsible Order Summary Bar */}
      <div className="mb-6 rounded-xs border border-line bg-surface p-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="flex w-full items-center justify-between text-body font-medium text-ink-900"
        >
          <span>Order total: <strong className="font-serif text-brand">{inr(total)}</strong></span>
          <span className="flex items-center gap-1 text-caption text-muted">
            {mobileSummaryOpen ? "Hide" : "Show summary"}
            {mobileSummaryOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </span>
        </button>
        {mobileSummaryOpen && (
          <div className="mt-4 pt-3 border-t border-line flex flex-col gap-3">
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-3 text-caption">
                {l.image && <img src={l.image} alt="" className="size-12 rounded-xs object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-900">{l.title}</p>
                  <p className="text-muted">By {l.maker.name} · Qty {l.qty}</p>
                </div>
                <span className="font-semibold text-ink-900">{inr(l.price * l.qty)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7/5 Grid Split */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
        {/* Start Column: 7 cols Form Steps */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {error && <Banner tone="danger">{error}</Banner>}

          {/* 1. Delivery Address Step */}
          <section className="rounded-sm border border-line bg-surface p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h2 className="font-serif text-h3 text-ink-900 flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-brand text-caption text-white font-mono">1</span>
                {t("deliver_to")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {addresses.data?.items.map((a) => (
                <RadioCard
                  key={a.id}
                  checked={chosen === a.id}
                  onChange={() => setAddressId(a.id)}
                  title={<span className="font-medium text-body-s text-ink-900">{a.name} · {a.phone}</span>}
                  description={
                    <span className="text-caption text-muted mt-1 block">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pin}
                    </span>
                  }
                />
              ))}

              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-xs border border-dashed border-line bg-surface-alt p-4 text-center text-body-s font-medium text-brand hover:border-brand transition-colors cursor-pointer"
              >
                <Plus className="size-5" />
                <span>{t("add_address")}</span>
              </button>
            </div>
          </section>

          {/* 2. Contact Information */}
          <section className="rounded-sm border border-line bg-surface p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h2 className="font-serif text-h3 text-ink-900 flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-brand text-caption text-white font-mono">2</span>
                Order Updates & Receipt
              </h2>
            </div>
            <div className="text-body-s text-ink-900">
              <p>Receipt and dispatch tracking will be sent to:</p>
              <p className="mt-1 font-mono font-medium text-brand">{me.email || me.phone_masked || me.display_name}</p>
            </div>
          </section>

          {/* 3. Payment Step */}
          <section className="rounded-sm border border-line bg-surface p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h2 className="font-serif text-h3 text-ink-900 flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-brand text-caption text-white font-mono">3</span>
                {t("payment")}
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {/* UPI Highlighted First */}
              <div className="rounded-xs border-2 border-brand bg-brand-soft/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-body font-semibold text-brand">
                    <Smartphone className="size-5" />
                    <span>Instant UPI (Recommended)</span>
                  </div>
                  <span className="rounded-full bg-brand px-2 py-0.5 text-caption font-semibold text-white">
                    Zero Fees
                  </span>
                </div>
                <p className="mt-1 text-caption text-muted">
                  Google Pay, PhonePe, Paytm, BHIM, Cred & any UPI app
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-caption">
                  <span className="rounded-xs border border-line bg-surface px-2 py-1 font-medium text-ink-900">GPay</span>
                  <span className="rounded-xs border border-line bg-surface px-2 py-1 font-medium text-ink-900">PhonePe</span>
                  <span className="rounded-xs border border-line bg-surface px-2 py-1 font-medium text-ink-900">Paytm</span>
                  <span className="rounded-xs border border-line bg-surface px-2 py-1 font-medium text-ink-900">BHIM</span>
                </div>
              </div>

              {/* Other Payment Methods */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-3 rounded-xs border border-line bg-surface p-3.5 text-body-s text-ink-800">
                  <CreditCard className="size-5 text-muted" />
                  <span>Debit / Credit Cards (Visa, Mastercard, RuPay)</span>
                </div>
                <div className="flex items-center gap-3 rounded-xs border border-line bg-surface p-3.5 text-body-s text-ink-800">
                  <Landmark className="size-5 text-muted" />
                  <span>Netbanking (All major Indian banks)</span>
                </div>
                <div className="flex items-center gap-3 rounded-xs border border-line bg-surface p-3.5 text-body-s text-ink-800">
                  <Globe2 className="size-5 text-muted" />
                  <span>International Cards</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-line">
              <Button
                variant="primary"
                size="L"
                block
                loading={busy}
                disabled={!lines.length || !chosen}
                onClick={pay}
              >
                {t("pay", { amount: inr(total) })}
              </Button>
              <p className="mt-2.5 text-center text-caption text-muted">
                {t("reserved_note") || "Items are reserved for 15 minutes once payment is initiated."}
              </p>
            </div>
          </section>
        </div>

        {/* End Column: 5 cols Sticky Summary with Maker Payouts */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="rounded-sm border border-line bg-surface p-6 shadow-xs flex flex-col gap-5">
            <h2 className="font-serif text-h3 text-ink-900 border-b border-line pb-3">
              Order Breakdown
            </h2>

            {/* Products List */}
            <ul className="divide-y divide-line">
              {lines.map((l, i) => (
                <li key={i} className="flex gap-3 py-3 items-center">
                  {l.image && (
                    <img src={l.image} alt="" className="size-16 rounded-xs border border-line object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1 text-body-s">
                    <p className="line-clamp-1 font-medium text-ink-900">{l.title}</p>
                    <p className="text-caption text-muted">From {l.maker.name} · Qty {l.qty}</p>
                  </div>
                  <span className="font-serif text-body-s font-semibold text-ink-900">{inr(l.price * l.qty)}</span>
                </li>
              ))}
            </ul>

            {/* "Who Gets Paid" Provenance Breakdown */}
            <div className="rounded-xs border border-line bg-surface-alt p-4">
              <span className="text-eyebrow text-brand block mb-2">Direct Maker Payouts</span>
              <ul className="flex flex-col gap-2 text-caption">
                {Object.entries(makerPayouts).map(([handle, m]) => (
                  <li key={handle} className="flex items-center justify-between">
                    <span className="font-medium text-ink-900">{m.name}</span>
                    <span className="font-serif text-brand font-semibold">{inr(m.amount)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-2 border-t border-line/60 flex items-center gap-1.5 text-[11px] text-verified font-medium">
                <ShieldCheck className="size-3.5" />
                <span>100% item value transferred directly to artisan bank accounts.</span>
              </div>
            </div>

            {/* Price Calculations */}
            <dl className="flex flex-col gap-2.5 text-body-s pt-2 border-t border-line">
              <div className="flex justify-between">
                <dt className="text-muted">{t("subtotal")}</dt>
                <dd className="font-medium text-ink-900">{inr(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t("shipping")}</dt>
                <dd className="font-medium text-verified">{t("free") || "Free"}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-body font-semibold text-ink-900">
                <dt>Total to pay</dt>
                <dd className="font-serif text-price text-ink-900">{inr(total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      {/* Address Form Drawer */}
      <Drawer open={adding} onClose={() => setAdding(false)} title={t("add_address")} side="end">
        <AddressForm
          onSaved={async (a) => {
            await addresses.refetch();
            setAddressId(a.id);
            setAdding(false);
          }}
        />
      </Drawer>

      {/* Test Payment Modal */}
      {fakeOrder && (
        <TestPayment
          order={fakeOrder}
          onPaid={() => success(fakeOrder.order_id)}
          onClose={() => setFakeOrder(null)}
        />
      )}
    </div>
  );
}

function TestPayment({ order, onPaid, onClose }: { order: PlaceOrder; onPaid: () => void; onClose: () => void }) {
  const t = useTranslations("checkout");
  const [method, setMethod] = useState("upi");
  const [busy, setBusy] = useState(false);
  const methods = [
    { id: "upi", icon: Smartphone, label: t("m_upi") },
    { id: "card", icon: CreditCard, label: t("m_card") },
    { id: "intl_card", icon: Globe2, label: t("m_intl") },
    { id: "netbanking", icon: Landmark, label: t("m_netbanking") },
    { id: "wallet", icon: Wallet, label: t("m_wallet") },
  ];

  return (
    <Drawer open onClose={onClose} title={t("test_title")} side="end">
      <div className="flex flex-col gap-4 py-2">
        <Banner tone="warn">{t("test_notice")}</Banner>
        <div className="flex flex-col gap-2">
          {methods.map(({ id, icon: Icon, label }) => (
            <RadioCard
              key={id}
              checked={method === id}
              onChange={() => setMethod(id)}
              title={
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  <span>{label}</span>
                </span>
              }
            />
          ))}
        </div>
        <Button
          variant="primary"
          size="L"
          loading={busy}
          block
          onClick={async () => {
            setBusy(true);
            try {
              await api(`/orders/${order.order_id}/payment/fake-complete`, { method: "POST", body: { method } });
              onPaid();
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("pay_test", { amount: inr(order.amount_paise / 100) })}
        </Button>
      </div>
    </Drawer>
  );
}

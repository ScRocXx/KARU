"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Globe2, Landmark, Lock, Smartphone, Wallet } from "lucide-react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { AddressForm, type Address } from "@/components/market/address-form";
import { useToast } from "@/components/toast";
import { Banner, Button, Card, Sheet, Skeleton } from "@/components/ui";
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
    queryFn: () => api<{ groups: { maker: ProductCardT["maker"]; items: { listing_id: string; qty: number; card: ProductCardT; available: boolean; line_total: number }[] }[]; subtotal_inr: number; count: number }>("/cart/items"),
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
  // One idempotency key per checkout visit: retries of "Pay" never create a second order.
  const [idemKey] = useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)));

  const chosen = addressId || addresses.data?.items.find((a) => a.is_default)?.id || addresses.data?.items[0]?.id || null;
  const lines = buyNow
    ? single.data
      ? [{ maker: single.data.maker, title: single.data.title, price: single.data.price_inr || 0, qty: 1, image: single.data.image?.thumb }]
      : []
    : (cart.data?.groups || []).flatMap((g) => g.items.filter((i) => i.available).map((i) => ({ maker: g.maker, title: i.card.title, price: i.card.price_inr || 0, qty: i.qty, image: i.card.image?.thumb })));
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

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
        theme: { color: "#1F2A6B" },
        // UPI first and highlighted; cards (incl. international), netbanking and wallets follow.
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
            // The webhook still completes the order; the success page polls.
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

  if (addresses.isLoading || (buyNow ? single.isLoading : cart.isLoading)) return <Skeleton className="mt-6 h-96" />;

  return (
    <div className="grid gap-8 pt-6 lg:grid-cols-[1fr_380px]">
      {config?.providers.payments === "razorpay" && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />}
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-[26px] md:text-4xl">{t("title")}</h1>
        <section>
          <h2 className="mb-3 font-semibold">{t("deliver_to")}</h2>
          <div className="flex flex-col gap-2">
            {addresses.data?.items.map((a) => (
              <label key={a.id} className={cx("flex cursor-pointer gap-3 rounded-[12px] border-2 bg-white p-4", chosen === a.id ? "border-indigo-900" : "border-ink-100")}>
                <input type="radio" name="addr" className="mt-1 accent-indigo-900" checked={chosen === a.id} onChange={() => setAddressId(a.id)} />
                <span className="text-[15px]">
                  <span className="font-semibold">{a.name}</span> · {a.phone}
                  <br />
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pin}
                </span>
              </label>
            ))}
            <Button variant="secondary" onClick={() => setAdding(true)}>{t("add_address")}</Button>
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-semibold">{t("payment")}</h2>
          <Card className="flex flex-col gap-2 p-4 text-[15px]">
            <p className="flex items-center gap-2 font-semibold text-indigo-900"><Smartphone className="size-5" /> {t("upi_first")}</p>
            <p className="flex items-center gap-2 text-ink-600"><CreditCard className="size-5" /> {t("cards")}</p>
            <p className="flex items-center gap-2 text-ink-600"><Globe2 className="size-5" /> {t("intl")}</p>
            <p className="flex items-center gap-2 text-ink-600"><Landmark className="size-5" /> {t("netbanking")}</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-ink-600"><Lock className="size-4" /> {t("secure")}</p>
          </Card>
        </section>
      </div>
      <aside className="h-fit rounded-[16px] border border-ink-100 bg-white p-5 lg:sticky lg:top-20">
        <h2 className="mb-3 font-semibold">{t("summary")}</h2>
        <ul className="flex flex-col gap-3">
          {lines.map((l, i) => (
            <li key={i} className="flex gap-3">
              {l.image && <img src={l.image} alt="" className="aspect-[4/5] w-14 rounded-[6px] object-cover" />}
              <div className="min-w-0 flex-1 text-sm">
                <p className="line-clamp-2 font-medium">{l.title}</p>
                <p className="text-ink-600">{t("paid_to", { maker: l.maker.name })}</p>
              </div>
              <p className="text-sm font-semibold">{inr(l.price * l.qty)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-ink-100 pt-3 text-lg font-semibold">
          <span>{t("total")}</span>
          <span>{inr(total)}</span>
        </div>
        <p className="mt-2 text-xs text-ink-600">{t("maker_gets_100")}</p>
        {error && <div className="mt-3"><Banner tone="danger">{error}</Banner></div>}
        <Button size="L" block className="mt-4" loading={busy} disabled={!lines.length} onClick={pay}>
          {t("pay", { amount: inr(total) })}
        </Button>
        <p className="mt-2 text-center text-xs text-ink-600">{t("reserved_note")}</p>
      </aside>
      <Sheet open={adding} onClose={() => setAdding(false)} title={t("add_address")}>
        <AddressForm
          onSaved={async (a) => {
            await addresses.refetch();
            setAddressId(a.id);
            setAdding(false);
          }}
        />
      </Sheet>
      {fakeOrder && <TestPayment order={fakeOrder} onPaid={() => success(fakeOrder.order_id)} onClose={() => setFakeOrder(null)} />}
    </div>
  );
}

/** Test-mode checkout used when no Razorpay keys are configured. Clearly labelled; no real money. */
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
    <Sheet open onClose={onClose} title={t("test_title")}>
      <div className="flex flex-col gap-4">
        <Banner tone="warn">{t("test_notice")}</Banner>
        <div className="flex flex-col gap-2" role="radiogroup">
          {methods.map(({ id, icon: Icon, label }, i) => (
            <label key={id} className={cx("flex min-h-14 cursor-pointer items-center gap-3 rounded-[12px] border-2 px-4", method === id ? "border-indigo-900 bg-indigo-50" : "border-ink-100", i === 0 && "ring-2 ring-haldi-500/40")}>
              <input type="radio" name="m" className="accent-indigo-900" checked={method === id} onChange={() => setMethod(id)} />
              <Icon className="size-5" /> <span className="font-medium">{label}</span>
              {i === 0 && <span className="ms-auto rounded-full bg-haldi-500 px-2 text-xs font-bold">{t("recommended")}</span>}
            </label>
          ))}
        </div>
        <Button
          size="L"
          loading={busy}
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
    </Sheet>
  );
}

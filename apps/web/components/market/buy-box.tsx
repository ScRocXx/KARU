"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Heart, Repeat, Share2, ShoppingBag, Truck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, api } from "@/lib/api";
import { approx, inr } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import type { Stock } from "@/lib/types";

const noopSubscribe = () => () => undefined;

export function BuyBox({
  product,
}: {
  product: { id: string; code: string; title: string; price_inr: number | null; stock: Stock };
}) {
  const t = useTranslations("product");
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinChecked, setPinChecked] = useState(false);

  const out = product.stock.state === "out";
  const maxQty = product.stock.count || 1;

  // Browser language for international conversion
  const lang = useSyncExternalStore(noopSubscribe, () => navigator.language, () => "en-IN");
  const intl = !lang.toLowerCase().endsWith("-in") && lang !== "hi";
  const currency = lang.startsWith("en-GB") ? "GBP" : "USD";

  const requireLogin = () => {
    router.push(`/login?next=${encodeURIComponent(`/p/${product.code}`)}`);
  };

  const addToCart = async (thenCheckout: boolean) => {
    if (!me) return requireLogin();
    setBusy(thenCheckout ? "buy" : "cart");
    try {
      if (thenCheckout) {
        router.push(`/checkout?buy_now=${product.id}&qty=${qty}`);
        return;
      }
      await api("/cart/items", { method: "POST", body: { listing_id: product.id, qty } });
      await qc.invalidateQueries({ queryKey: ["cart"] });
      toast(t("added_to_cart"));
    } catch (e) {
      toast(e instanceof ApiError && e.code === "out_of_stock" ? t("just_sold_out") : t("error"), "error");
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/p/${product.code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.title, url });
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast(t("link_copied"));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {intl && product.price_inr && (
        <p className="text-caption text-muted">
          {t("approx_intl", { approx: approx(product.price_inr, currency) || "" })}
        </p>
      )}

      {/* Quantity Stepper (if stock > 1) */}
      {!out && maxQty > 1 && (
        <div className="flex items-center gap-4">
          <span className="text-body-s font-medium text-text">Quantity:</span>
          <QuantityStepper
            value={qty}
            onChange={setQty}
            min={1}
            max={maxQty}
          />
          <span className="text-caption text-muted">({maxQty} available)</span>
        </div>
      )}

      {/* Action Buttons */}
      {out ? (
        <div className="flex gap-3">
          <Button
            size="L"
            block
            icon={<Repeat className="size-5" />}
            onClick={() => (me ? setRequestOpen(true) : requireLogin())}
          >
            {t("request_again")}
          </Button>
          <IconButton aria-label="Share" onClick={share} variant="surface">
            <Share2 className="size-5" />
          </IconButton>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              size="L"
              variant="primary"
              block
              loading={busy === "buy"}
              icon={<Zap className="size-5" />}
              onClick={() => addToCart(true)}
            >
              {t("buy_now")}
            </Button>
            <Button
              size="L"
              variant="secondary"
              block
              loading={busy === "cart"}
              icon={<ShoppingBag className="size-5" />}
              onClick={() => addToCart(false)}
            >
              {t("add_to_cart")}
            </Button>
            <IconButton aria-label="Share" onClick={share} variant="surface">
              <Share2 className="size-5" />
            </IconButton>
          </div>
        </div>
      )}

      {/* Delivery Estimate Check by PIN */}
      <div className="rounded-sm border border-line bg-surface-alt p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-body-s font-semibold text-text flex items-center gap-1.5">
            <Truck className="size-4 text-brand" /> Delivery Check
          </span>
          <span className="text-caption text-muted">Direct from artisan</span>
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ""));
              setPinChecked(false);
            }}
            placeholder="Enter 6-digit PIN code"
            className="text-body-s"
          />
          <Button
            variant="secondary"
            size="M"
            disabled={pin.length < 6}
            onClick={() => setPinChecked(true)}
          >
            Check
          </Button>
        </div>
        {pinChecked && (
          <p className="text-caption text-peacock-700 font-medium flex items-center gap-1.5 pt-1">
            <Check className="size-3.5" /> Direct cluster dispatch: estimated delivery in 3–5 business days.
          </p>
        )}
      </div>

      {/* Mobile Sticky Buy Bar (Replaces bottom nav on PDP) */}
      {!out && (
        <div className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-surface/98 backdrop-blur-md px-4 py-3 md:hidden shadow-sheet">
          <div className="flex flex-col">
            <span className="text-caption text-muted">Direct Artisan Price</span>
            <span className="font-serif text-h3 text-text tabular-nums">{inr(product.price_inr)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="M"
              variant="primary"
              loading={busy === "buy"}
              onClick={() => addToCart(true)}
            >
              {t("buy_now")}
            </Button>
          </div>
        </div>
      )}

      <RequestAgainSheet
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        listingId={product.id}
      />
    </div>
  );
}

/** RequestAgainSheet: artisan requests inbox drawer. */
function RequestAgainSheet({
  open,
  onClose,
  listingId,
}: {
  open: boolean;
  onClose: () => void;
  listingId: string;
}) {
  const t = useTranslations("product");
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const [by, setBy] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Drawer open={open} onClose={onClose} title={t("request_again")}>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api(`/listings/${listingId}/make-again`, {
              method: "POST",
              body: { quantity: qty, needed_by: by || null, note: note || null },
            });
            toast(t("request_sent"));
            onClose();
          } catch {
            toast(t("error"), "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-body-s text-muted">{t("request_again_body")}</p>
        <Field label={t("quantity")} htmlFor="ra-q">
          <Input
            id="ra-q"
            type="number"
            min={1}
            max={500}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          />
        </Field>
        <Field label={t("needed_by")} htmlFor="ra-d">
          <Input
            id="ra-d"
            type="date"
            value={by}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBy(e.target.value)}
          />
        </Field>
        <Field label={t("note")} htmlFor="ra-n">
          <Textarea
            id="ra-n"
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <Button type="submit" size="L" variant="primary" loading={busy} block>
          {t("send_request")}
        </Button>
      </form>
    </Drawer>
  );
}

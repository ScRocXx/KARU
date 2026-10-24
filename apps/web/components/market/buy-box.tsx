"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Repeat, Share2, ShoppingBag, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { useToast } from "@/components/toast";
import { Button, Field, Input, Sheet, Textarea } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { approx } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import type { Stock } from "@/lib/types";

const noopSubscribe = () => () => undefined;

export function BuyBox({ product }: { product: { id: string; code: string; title: string; price_inr: number | null; stock: Stock } }) {
  const t = useTranslations("product");
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const out = product.stock.state === "out";
  // Browser language only exists on the client; the server render assumes an Indian visitor.
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
        router.push(`/checkout?buy_now=${product.id}`);
        return;
      }
      await api("/cart/items", { method: "POST", body: { listing_id: product.id, qty: 1 } });
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
    <div className="sticky bottom-16 z-30 -mx-4 flex flex-col gap-2 border-t border-ink-100 bg-khadi-50/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
      {intl && product.price_inr ? <p className="text-xs text-ink-600">{t("approx_intl", { approx: approx(product.price_inr, currency) || "" })}</p> : null}
      {out ? (
        <div className="flex gap-2">
          <Button size="L" block icon={<Repeat className="size-5" />} onClick={() => (me ? setRequestOpen(true) : requireLogin())}>
            {t("request_again")}
          </Button>
          <Button size="L" variant="secondary" onClick={share} aria-label={t("share")}>
            <Share2 className="size-5" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button size="L" variant="secondary" block loading={busy === "cart"} icon={<ShoppingBag className="size-5" />} onClick={() => addToCart(false)}>
            {t("add_to_cart")}
          </Button>
          <Button size="L" block loading={busy === "buy"} icon={<Zap className="size-5" />} onClick={() => addToCart(true)}>
            {t("buy_now")}
          </Button>
          <Button size="L" variant="tertiary" onClick={share} aria-label={t("share")} className="px-3">
            <Share2 className="size-5" />
          </Button>
        </div>
      )}
      <RequestAgainSheet open={requestOpen} onClose={() => setRequestOpen(false)} listingId={product.id} />
    </div>
  );
}

/** B16: quantity, by when, note → artisan's Requests inbox (F7). */
function RequestAgainSheet({ open, onClose, listingId }: { open: boolean; onClose: () => void; listingId: string }) {
  const t = useTranslations("product");
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const [by, setBy] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title={t("request_again")}>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api(`/listings/${listingId}/make-again`, { method: "POST", body: { quantity: qty, needed_by: by || null, note: note || null } });
            toast(t("request_sent"));
            onClose();
          } catch {
            toast(t("error"), "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-ink-600">{t("request_again_body")}</p>
        <Field label={t("quantity")} htmlFor="ra-q">
          <Input id="ra-q" type="number" min={1} max={500} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
        </Field>
        <Field label={t("needed_by")} htmlFor="ra-d">
          <Input id="ra-d" type="date" value={by} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setBy(e.target.value)} />
        </Field>
        <Field label={t("note")} htmlFor="ra-n">
          <Textarea id="ra-n" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button type="submit" size="L" loading={busy}>
          {t("send_request")}
        </Button>
      </form>
    </Sheet>
  );
}

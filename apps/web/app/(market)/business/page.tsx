"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Banner, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { ApiError, api } from "@/lib/api";

/** B14: bulk sourcing requests for SHGs, co-ops, NGOs, exporters → Karu staff (F9). */
export default function BusinessPage() {
  const t = useTranslations("business");
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => api<{ items: { slug: string; name: string }[] }>("/catalog/categories") });
  const [f, setF] = useState({ org_name: "", contact_name: "", contact_phone: "", contact_email: "", category_slug: "", product_type: "", description: "", quantity: "", target_price_inr: "", deadline: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  if (done)
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
        <CheckCircle2 className="size-14 text-peacock-600" />
        <h1 className="font-display text-3xl">{t("thanks")}</h1>
        <p className="text-ink-600">{t("thanks_body")}</p>
      </div>
    );
  return (
    <div className="mx-auto grid max-w-5xl gap-10 py-8 lg:grid-cols-2">
      <section className="flex flex-col gap-4">
        <h1 className="font-display text-[32px] leading-tight md:text-5xl">{t("title")}</h1>
        <p className="text-[17px] text-ink-600">{t("intro")}</p>
        <ol className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-900 font-bold text-white">{n}</span>
              <span className="pt-1">{t(`step${n}`)}</span>
            </li>
          ))}
        </ol>
      </section>
      <form
        className="flex flex-col gap-4 rounded-[16px] border border-ink-100 bg-white p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api("/business/bulk-requests", {
              method: "POST",
              body: {
                ...f,
                category_slug: f.category_slug || null,
                quantity: Number(f.quantity),
                target_price_inr: f.target_price_inr ? Number(f.target_price_inr) : null,
                deadline: f.deadline || null,
                description: f.description || null,
              },
            });
            setDone(true);
          } catch (err) {
            setError(err instanceof ApiError && err.code === "rate_limited" ? t("rate_limited") : t("error"));
          } finally {
            setBusy(false);
          }
        }}
      >
        {error && <Banner tone="danger">{error}</Banner>}
        <Field label={t("org")} htmlFor="b-org"><Input id="b-org" required value={f.org_name} onChange={set("org_name")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("contact")} htmlFor="b-cn"><Input id="b-cn" required value={f.contact_name} onChange={set("contact_name")} autoComplete="name" /></Field>
          <Field label={t("phone")} htmlFor="b-cp"><Input id="b-cp" required inputMode="tel" value={f.contact_phone} onChange={set("contact_phone")} autoComplete="tel" /></Field>
        </div>
        <Field label={t("email")} htmlFor="b-ce"><Input id="b-ce" required type="email" value={f.contact_email} onChange={set("contact_email")} autoComplete="email" /></Field>
        <Field label={t("category")} htmlFor="b-cat">
          <Select id="b-cat" value={f.category_slug} onChange={set("category_slug")}>
            <option value="">{t("any_category")}</option>
            {cats?.items.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label={t("product_type")} htmlFor="b-pt"><Input id="b-pt" required value={f.product_type} onChange={set("product_type")} placeholder={t("product_type_ph")} /></Field>
        <Field label={t("description")} htmlFor="b-d"><Textarea id="b-d" value={f.description} onChange={set("description")} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("quantity")} htmlFor="b-q"><Input id="b-q" required type="number" min={1} value={f.quantity} onChange={set("quantity")} /></Field>
          <Field label={t("target_price")} htmlFor="b-tp"><Input id="b-tp" type="number" min={1} value={f.target_price_inr} onChange={set("target_price_inr")} /></Field>
          <Field label={t("deadline")} htmlFor="b-dl"><Input id="b-dl" type="date" value={f.deadline} onChange={set("deadline")} /></Field>
        </div>
        <Button type="submit" size="L" loading={busy}>{t("submit")}</Button>
        <p className="text-xs text-ink-600">{t("privacy")}</p>
      </form>
    </div>
  );
}

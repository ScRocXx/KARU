"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, Tag, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, api } from "@/lib/api";

export default function BusinessPage() {
  const t = useTranslations("business");
  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<{ items: { slug: string; name: string }[] }>("/catalog/categories"),
  });

  const [f, setF] = useState({
    org_name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    category_slug: "",
    product_type: "",
    description: "",
    quantity: "",
    target_price_inr: "",
    deadline: "",
  });

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  if (done) {
    return (
      <div className="container-prose mx-auto flex flex-col items-center gap-4 py-24 text-center">
        <CheckCircle2 className="size-16 text-verified" />
        <h1 className="font-serif text-h1 text-ink-900">{t("thanks") || "Inquiry Received"}</h1>
        <p className="text-body text-muted leading-relaxed max-w-md">
          {t("thanks_body") || "Our craft cluster coordinators will review your specifications and connect you directly with certified artisan producer groups within 48 hours."}
        </p>
      </div>
    );
  }

  return (
    <div className="container-page py-10 lg:py-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">
        {/* Left Column: Editorial Value Proposition (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <span className="text-eyebrow text-brand">Institutional & Bulk Sourcing</span>
          <h1 className="font-serif text-display text-ink-900 leading-tight">
            Handmade, at scale, with proof.
          </h1>
          <p className="text-body-l text-muted leading-relaxed">
            Source corporate gifts, hospitality linens, architectural terracotta, and bespoke GI textiles directly from certified master clusters.
          </p>

          <div className="flex flex-col gap-4 pt-4 border-t border-line">
            <div className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xs bg-brand-soft text-brand font-semibold">
                <Users className="size-5" />
              </span>
              <div>
                <h4 className="font-medium text-body text-ink-900">Direct From Verified Maker Cooperatives</h4>
                <p className="text-caption text-muted mt-0.5">Zero middlemen markups. Fair wages transferred directly to artisans.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xs bg-brand-soft text-brand font-semibold">
                <Tag className="size-5" />
              </span>
              <div>
                <h4 className="font-medium text-body text-ink-900">Karu ID on Every Single Unit</h4>
                <p className="text-caption text-muted mt-0.5">Every piece carries its own QR registry passport proving physical artisan authenticity.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xs bg-brand-soft text-brand font-semibold">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h4 className="font-medium text-body text-ink-900">Cluster Quality Assurance</h4>
                <p className="text-caption text-muted mt-0.5">Physical yarn, weave, and craft checks verified before dispatch.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Institutional Request Form (7 cols) */}
        <form
          className="lg:col-span-7 flex flex-col gap-5 rounded-sm border border-line bg-surface p-6 sm:p-8 shadow-xs"
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
              setError(err instanceof ApiError && err.code === "rate_limited" ? t("rate_limited") || "Rate limited" : t("error") || "Error submitting");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="border-b border-line pb-3">
            <h2 className="font-serif text-h3 text-ink-900">Sourcing Inquiry</h2>
            <p className="text-caption text-muted mt-0.5">Fill out your requirements for a custom proposal and sample dispatch.</p>
          </div>

          {error && <Banner tone="danger">{error}</Banner>}

          <Field label={t("org") || "Organisation / Company Name"}>
            <Input required value={f.org_name} onChange={set("org_name")} placeholder="e.g. FabIndia, Tata Hospitality, Studio Design" />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("contact") || "Contact Person"}>
              <Input required value={f.contact_name} onChange={set("contact_name")} autoComplete="name" />
            </Field>
            <Field label={t("phone") || "Phone / WhatsApp"}>
              <Input required inputMode="tel" value={f.contact_phone} onChange={set("contact_phone")} autoComplete="tel" placeholder="+91 98765 43210" />
            </Field>
          </div>

          <Field label={t("email") || "Official Email"}>
            <Input required type="email" value={f.contact_email} onChange={set("contact_email")} autoComplete="email" placeholder="procurement@company.com" />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("category") || "Craft Category"}>
              <Select value={f.category_slug} onChange={set("category_slug")}>
                <option value="">{t("any_category") || "Select Category"}</option>
                {cats?.items.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("product_type") || "Product Type"}>
              <Input required value={f.product_type} onChange={set("product_type")} placeholder="e.g. Silk stoles, Brass bowls, Cane planters" />
            </Field>
          </div>

          <Field label={t("description") || "Specifications & Customization"}>
            <Textarea value={f.description} onChange={set("description")} rows={3} placeholder="Dimensions, colours, custom packaging or logo embossing requirements..." />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t("quantity") || "Units (Approx)"}>
              <Input required type="number" min={1} value={f.quantity} onChange={set("quantity")} placeholder="50" />
            </Field>
            <Field label={t("target_price") || "Target Price (₹)"}>
              <Input type="number" min={1} value={f.target_price_inr} onChange={set("target_price_inr")} placeholder="Per unit budget" />
            </Field>
            <Field label={t("deadline") || "Target Delivery"}>
              <Input type="date" value={f.deadline} onChange={set("deadline")} />
            </Field>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="L" block loading={busy}>
              {t("submit") || "Send Bulk Inquiry"}
            </Button>
            <p className="mt-2.5 text-center text-[11px] text-muted">
              {t("privacy") || "Your business details are strictly kept confidential and shared only with certified producer partners."}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { Loader2, X } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/format";

type Variant = "primary" | "secondary" | "tertiary" | "danger" | "verified";
type Size = "L" | "M" | "S";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-indigo-900 text-white hover:bg-indigo-700 disabled:bg-ink-300",
  secondary: "border-2 border-indigo-900 text-indigo-900 bg-white hover:bg-indigo-50 disabled:border-ink-300 disabled:text-ink-300",
  tertiary: "text-indigo-900 hover:bg-indigo-50 disabled:text-ink-300",
  danger: "bg-danger-600 text-white hover:opacity-90 disabled:bg-ink-300",
  verified: "bg-peacock-600 text-white hover:opacity-90",
};
const SIZES: Record<Size, string> = {
  L: "min-h-12 px-5 text-base gap-2 rounded-[10px]",
  M: "min-h-11 px-4 text-[15px] gap-2 rounded-[10px]",
  S: "min-h-9 px-3 text-sm gap-1.5 rounded-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "M", loading, icon, block, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(
        "inline-flex items-center justify-center font-semibold transition-colors duration-150 disabled:cursor-not-allowed select-none",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("rounded-[12px] border border-ink-100 bg-white", className)} {...rest}>
      {children}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label?: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-900">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-600">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "w-full rounded-[8px] border border-ink-300 bg-white px-3 py-2.5 text-base text-ink-900 placeholder:text-ink-600/70 focus:border-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-900/20 disabled:bg-ink-100";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(inputBase, "min-h-12", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} className={cx(inputBase, "min-h-24", className)} {...rest} />;
});

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(inputBase, "min-h-12 pe-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-semibold text-ink-900">
          {label}
        </label>
        {description && <p className="text-sm text-ink-600">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx("tap relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors", checked ? "bg-peacock-600" : "bg-ink-300")}
      >
        <span className={cx("inline-block size-6 rounded-full bg-white shadow transition-transform", checked ? "translate-x-7 rtl:-translate-x-7" : "translate-x-1 rtl:-translate-x-1")} />
      </button>
    </div>
  );
}

export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors",
        active ? "border-indigo-900 bg-indigo-900 text-white" : "border-ink-300 bg-white text-ink-900 hover:border-indigo-900",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cx("no-scrollbar flex gap-1 overflow-x-auto border-b border-ink-100", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            "min-h-11 whitespace-nowrap border-b-[3px] px-3 text-[15px] font-semibold transition-colors",
            value === t.value ? "border-indigo-900 text-indigo-900" : "border-transparent text-ink-600 hover:text-ink-900",
          )}
        >
          {t.label}
          {t.count ? <span className="ms-1.5 rounded-full bg-terracotta-600 px-1.5 text-xs text-white">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-[8px] bg-ink-100", className)} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx("size-6 animate-spin text-indigo-900", className)} aria-hidden />;
}

/** Empty state: hand-drawn style spot illustration + one action (Part 1 §9.1). */
export function EmptyState({ title, body, action, art = "loom" }: { title: ReactNode; body?: ReactNode; action?: ReactNode; art?: "loom" | "basket" | "thread" }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <SpotArt kind={art} />
      <h3 className="font-display mt-4 text-xl text-ink-900">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-ink-600">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function SpotArt({ kind }: { kind: "loom" | "basket" | "thread" }) {
  const stroke = "var(--color-indigo-900)";
  const accent = "var(--color-haldi-500)";
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden>
      {kind === "loom" && (
        <>
          <path d="M18 12v72M102 12v72M14 16h92M14 80h92" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          {[30, 42, 54, 66, 78, 90].map((x) => (
            <path key={x} d={`M${x} 18v60`} stroke={stroke} strokeWidth="1.5" opacity=".5" />
          ))}
          <path d="M22 40c14 6 26-6 40 0s26 6 38 0" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M22 52c14 6 26-6 40 0s26 6 38 0" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {kind === "basket" && (
        <>
          <path d="M20 38h80l-10 42H30L20 38Z" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <path d="M40 38c0-16 40-16 40 0" stroke={stroke} strokeWidth="3" />
          {[48, 58, 68].map((y) => (
            <path key={y} d={`M${24 + (y - 38) / 4} ${y}h${72 - (y - 38) / 2}`} stroke={accent} strokeWidth="2.5" />
          ))}
        </>
      )}
      {kind === "thread" && (
        <>
          <circle cx="44" cy="48" r="22" stroke={stroke} strokeWidth="3" />
          <path d="M30 40h28M30 48h28M30 56h28" stroke={accent} strokeWidth="2.5" />
          <path d="M66 48c14 0 14 24 30 18" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
        </>
      )}
    </svg>
  );
}

export function Stars({ value, size = 16, onChange, label }: { value: number; size?: number; onChange?: (v: number) => void; label?: string }) {
  return (
    <div className="inline-flex items-center gap-0.5" role={onChange ? "radiogroup" : "img"} aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = value >= n ? 1 : value >= n - 0.5 ? 0.5 : 0;
        const star = (
          <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <defs>
              <linearGradient id={`s${n}-${size}-${fill}`}>
                <stop offset={`${fill * 100}%`} stopColor="var(--color-haldi-500)" />
                <stop offset={`${fill * 100}%`} stopColor="var(--color-ink-100)" />
              </linearGradient>
            </defs>
            <path fill={`url(#s${n}-${size}-${fill})`} d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
          </svg>
        );
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n}`} onClick={() => onChange(n)} className="tap flex items-center justify-center">
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}

/** Tiny completion ring on the avatar (Part 1 §4.1). */
export function ProgressRing({ value, size = 36, children }: { value: number; size?: number; children?: ReactNode }) {
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-ink-100)" strokeWidth="3" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-haldi-500)" strokeWidth="3" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" />
      </svg>
      {children}
    </span>
  );
}

export function Stepper({ steps }: { steps: { label: ReactNode; state: "done" | "current" | "todo" | "warn"; detail?: ReactNode }[] }) {
  return (
    <ol className="flex flex-col gap-0">
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
          {i < steps.length - 1 && <span className="absolute start-[15px] top-8 h-[calc(100%-24px)] w-0.5 bg-ink-100" aria-hidden />}
          <span
            className={cx(
              "z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              s.state === "done" && "bg-peacock-600 text-white",
              s.state === "current" && "bg-indigo-900 text-white",
              s.state === "warn" && "bg-haldi-500 text-ink-900",
              s.state === "todo" && "border-2 border-ink-300 bg-white text-ink-600",
            )}
          >
            {s.state === "done" ? "✓" : s.state === "warn" ? "!" : i + 1}
          </span>
          <div className="pt-1">
            <div className="font-semibold text-ink-900">{s.label}</div>
            {s.detail && <div className="text-sm text-ink-600">{s.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Bottom sheet on mobile, centred dialog on desktop (native <dialog> for focus trapping + Esc). */
export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  const t = useTranslations("common");
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cx(
        "m-0 mt-auto max-h-[92vh] w-full max-w-none rounded-t-[20px] bg-white p-0 text-ink-900 backdrop:bg-ink-900/40 md:m-auto md:rounded-[20px]",
        wide ? "md:max-w-2xl" : "md:max-w-lg",
      )}
    >
      {open && (
        <div className="flex max-h-[92vh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
            <h2 className="font-display text-lg">{title}</h2>
            <button onClick={onClose} className="tap -me-2 flex items-center justify-center rounded-full hover:bg-ink-100" aria-label={t("close")}>
              <X className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto p-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}

export function Banner({ tone = "info", children, action, icon }: { tone?: "info" | "warn" | "success" | "danger"; children: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  const tones = {
    info: "bg-indigo-50 text-indigo-900 border-indigo-900/15",
    warn: "bg-haldi-100 text-ink-900 border-haldi-500/40",
    success: "bg-peacock-50 text-peacock-600 border-peacock-600/20",
    danger: "bg-[#fbeceb] text-danger-600 border-danger-600/20",
  };
  return (
    <div className={cx("flex items-center gap-3 rounded-[12px] border px-4 py-3", tones[tone])} role={tone === "danger" ? "alert" : "status"}>
      {icon}
      <div className="flex-1 text-[15px] font-medium">{children}</div>
      {action}
    </div>
  );
}

# Karu — Frontend Redesign Spec ("Haat & Heirloom")

> **Status:** proposal, ready to implement · **Date:** 25 Oct 2026 · **Scope:** every screen in `apps/web` — marketplace, Karu ID proof page, seller studio (`/sell`), staff console (`/admin`), system pages.
> **References:** *Mrittika — Tradition in every thread* (editorial split hero, bordered product cards, "Rooted in Heritage" craft grid, "Heritage Edit" banner) and *Terra & Soul — Made by Hands* (announcement bar, centred wordmark, circular category portals, deckle-edge dividers, "Shop by Room" strip, olive testimonial panel, terracotta footer).
> **Supersedes:** Part 1 §9 (design system) of `KARU_PRODUCT_SPEC.md` where the two disagree. Section 12 lists every spec change.

---

## 0. Goal in one paragraph

Karu should feel like a **premium craft house on desktop** and a **fast, thumb-friendly haat (village market) on phones**, with **one visual language** across buyer, seller and staff surfaces. The look comes from the two references: warm khadi paper, terracotta, deep neem olive, zari gold, editorial serif headlines, square-cornered buttons, full-bleed photo bands. What makes it **Karu and Indian** is kept and made more visible: the maker's name on every piece, the Karu ID / proof of handmade, GI crafts and regions, eight languages including RTL Urdu, ₹ and UPI, festive and wedding edits. Nothing on the page is fabricated (no stock "generic India" photos, no invented testimonials).

### Goals
1. A single token-driven design system (colour, type, space, radius, motion) that every component uses. No hex values and no invented class names in components.
2. A real desktop layout for **every** route (today only home, PDP and `/k` were redesigned; account, cart, checkout, seller and admin are still phone layouts stretched wide).
3. Rebuild every shared component to the new spec (section 6) and every page to the new layouts (section 7).
4. Keep the hard constraints: 8 languages + RTL, WCAG 2.2 AA, `/k` page under 60 KB HTML with minimal JS, artisan touch targets ≥ 48 px, offline-first seller flow.

### Non-goals
- Dark mode (tokens are ready for it; ship later).
- New business features. The only backend work is for **content the new layouts need** (section 10.2).
- Swapping frameworks or adding a component library. We stay on Next 16 + Tailwind v4 + lucide-react, with no animation library.

---

## 1. Audit — where the UI is today

The last commit (`60824b9 feat(ui): redesign Karu into premium artisanal marketplace`) moved home, PDP, `/k`, header and footer toward the references. It left the rest of the app behind and brought in some regressions. These must be fixed as part of this redesign:

| # | Finding | Evidence | Impact |
|---|---|---|---|
| A1 | **Two visual languages.** Marketplace home/PDP use terracotta; ~45 files still use indigo as primary (cart CTA, checkout, account icons, all of `/sell`, admin nav, 404/error). | `grep -rc "indigo-" app components` → review.tsx 12, sell/products/[id] 9, artisan/shell 7, checkout 5 … | Brand looks unfinished: a buyer moves from a terracotta PDP to an indigo cart. |
| A2 | **21 colour classes point to tokens that don't exist**, so Tailwind emits nothing and the style silently disappears. | `ink-500` (15 uses), `gold-400` (10), `sand-300` (9), `ink-700` (6), `peacock-200/300/400/800/900`, `gold-300/700/800/900/950`, `haldi-400`, `sand-400`. `indigo-100/200/600` and `stone-400/500` fall back to Tailwind's **default** palette (cold blue/grey, off-brand). | Muted text renders in inherited colour; borders vanish. |
| A3 | **~300 arbitrary values** (`text-[10px]` ×50, `text-[15px]` ×41, `rounded-[16px]` ×34, `bg-[#FAF7F2]` …). | grep of `\[…px\]` / `\[#…\]` | No scale, so it can't be kept consistent. |
| A4 | **Hard-coded English** in the new home sections: announcement bar, hero headline, trust hallmarks, category showcase, heritage grid, artisan spotlight, testimonials, footer newsletter. | `chrome.tsx` `TopBanner`, `page.tsx` hero, `patron-testimonials.tsx` | Breaks the "entire UI is translated" rule (Part 1 §8.1). Hindi/Urdu users see English blocks. |
| A5 | **Made-up testimonials** ("Ananya Sharma, New Delhi" …) presented as real buyers. | `patron-testimonials.tsx` `TESTIMONIALS` | Goes against Karu's core promise: proof, with reviews from verified purchasers only (Part 1 §4.2). Must be removed or fed by real reviews. |
| A6 | **Hot-linked Unsplash stock photos** (15 URLs) for categories, heritage grid, spotlight. | `category-showcase.tsx`, `heritage-process.tsx` | Spec §9.1 "Don't: stock photos of generic India"; third-party dependency; images don't match what's sold. |
| A7 | **Phone-only layouts on desktop.** Account `max-w-2xl` single column; seller studio `max-w-3xl` with bottom nav on a 1440 px screen; order detail `max-w-2xl`. | `account/*`, `components/artisan/shell.tsx` | "Very good on phones, not for web". |
| A8 | **Layout can't go full-bleed.** `(market)/layout.tsx` wraps every page in `<main max-w-[1360px] px-…>`, so sections sit inside rounded boxes instead of edge-to-edge bands like the references. | `app/(market)/layout.tsx` | Looks like a template, not an editorial site. |
| A9 | **Text too small for desktop**: 8.5–11 px uppercase labels with heavy tracking. | wordmark tagline 8.5 px, card maker 11 px, bottom nav 10 px | Fails legibility, especially with Indic scripts. |
| A10 | **RTL leaks**: physical classes (`ml-`, `-right-`, `translate-x-`) in the new home components (21 places). | `page.tsx`, `artisan-spotlight.tsx`, `patron-testimonials.tsx` | Urdu layout breaks. |
| A11 | **Rounded "pill everything"** (buttons, chips, search, cards at 14–28 px radius). | `ui.tsx` `SIZES` | Both references use square or near-square corners. Pills read "app", not "atelier". |
| A12 | **Duplicated patterns**: the "eyebrow + serif title + View all →" header is hand-written 6+ times; card shells hand-written per page. | home, PDP, craft rails | Drift; every new page re-invents it. |

What is already good and **stays**: the token-in-`@theme` approach, the per-script Noto font loading, Fraunces as display face, the 4:5 product ratio, `VerifiedBadge` semantics (icon + text, never colour alone), the woven motif, server-rendered `/k` with tiny JS, native `<dialog>` sheet, the `check:i18n` script.

---

## 2. Design direction — "Haat & Heirloom"

**Haat** is the Indian village market: abundant, local, maker-to-buyer. **Heirloom** is the premium promise: pieces with a name, a place and proof. Phones lean *haat* (dense, quick, scroll-and-tap). Desktop leans *heirloom* (editorial, spacious, story-led). Both use the same tokens and components.

### 2.1 What we take from each reference → how Karu adapts it

| Reference element | Source | Karu adaptation |
|---|---|---|
| Thin coloured announcement bar | Terra & Soul | Terracotta bar, 3 rotating i18n messages ("Every piece carries a Karu ID", "Free shipping over ₹999", "Paid directly to the maker"), with **Sell on Karu** and **Track order** utility links at the end (desktop). |
| Centred wordmark with emblem above | Terra & Soul | Karu sun emblem + `KARU` + tagline "Handmade in India · Proven", centred on desktop header. |
| Split editorial hero with numbered slides `01 —— 03` and vertical side tagline | Mrittika | Hero carousel of **Karu Edits** (Festive, Wedding trousseau, a craft cluster story). Real product/maker photography. Vertical tagline "Handwoven · Verified · Direct". |
| Torn-paper (deckle) edge under the hero | Terra & Soul | Inline SVG deckle divider, used **once per page at most** (hero bottom, footer top). |
| Circular category portals with "SHOP NOW" | Terra & Soul | Craft categories (Sarees, Pottery, Brass …) with photos from Karu's own catalogue. |
| Bordered product cards with info panel, tag ("New", "Best Seller"), `+` quick add | Mrittika | `ProductCard` grid variant. Tags become **Karu Verified**, **GI craft**, **New**, **Only 2 left**. Maker + place is always shown (USP). |
| "Featured Pieces" — intro column + row of products | Terra & Soul | Craft rails: left column has craft name, region, GI tag and a one-line heritage note; right side shows 4 products. |
| "Rooted in Heritage" — copy + 4 process photos | Mrittika | Craft technique grid (Handloom, Hand embroidery, Block printing, Wheel-thrown clay) using **making-video stills from verified listings**, each linking to `/craft/[slug]`. |
| "Shop by Room" photo strip with label plates | Terra & Soul | **Shop by Region**: Bhagalpur · Kutch · Varanasi · Khurja · Channapatna · Madhubani. This is the "local Indian" USP no generic store has. |
| "The Heritage Edit" full-bleed banner with link list | Mrittika | **The Karu Edit**: seasonal curated banner (Diwali gifting, Wedding, Monsoon handlooms) with a category link list. |
| "The Story Behind Every Piece" + olive "Words from Our Community" | Terra & Soul | Maker spotlight (real maker, real quote from their Passport story) + **real verified-purchase reviews** on a neem-olive panel. |
| Terracotta footer with newsletter | Terra & Soul / Mrittika | Terracotta footer: "Join the Karu Circle" (new drops and maker stories, no discount bait), 4 link columns, language picker, payment marks (UPI first), "Made in India". |

### 2.2 What we deliberately do **not** copy
- Script/handwriting fonts ("Featured Pieces", "Shop by Room"). They exist only in Latin and would break in 7 of our 8 languages. We use **Fraunces italic in terracotta** for the same accent ("Chosen by *Heart*"), which works in every script through the Noto Serif fallbacks.
- Discount-led newsletter ("Get 10% off"). Karu's voice avoids "deal / cheap" (Part 1 §8.3).
- Model-heavy fashion photography as the default. Karu leads with **the piece and the maker's hands**, and people only when they are the actual maker.

### 2.3 Five design principles
1. **Maker first.** Every product surface names the maker and the place. Every story surface shows the maker's face or hands.
2. **Proof is beautiful, not bureaucratic.** Verification looks like a luxury label (peacock + zari), never a stamp or certificate guilloche.
3. **Paper, not plastic.** Khadi backgrounds, hairline borders, almost no shadows, square corners, generous whitespace.
4. **One system, two tempos.** The same components, but desktop gets editorial spacing and hover detail, and mobile gets density, sticky actions and bottom sheets.
5. **Every language is first-class.** No layout that only works with short English words. Design with Hindi and Tamil strings that are ~30% longer, and mirror for Urdu.

---

## 3. Design tokens

All tokens live in `apps/web/app/globals.css` inside `@theme`. Components use **semantic** utilities (`bg-surface`, `text-muted`, `border-line`, `bg-brand`) wherever possible, and palette steps only for illustration-level detail.

### 3.1 Colour — primitive ramps (complete, no gaps)

Every family gets a full 50–950 ramp, so classes like `ink-500` or `sand-300` resolve (fixes A2). `indigo` and `haldi` are **retired** (see 3.3).

| Family | Role | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `khadi` | paper / page | `#FBF8F2` | `#F6F0E6` | `#EEE5D6` | `#E2D6C3` | — | — | — | — | — | — | — |
| `sand` | lines, hovers, skeletons | `#F7F4EE` | `#EBE4D8` | `#E5DED3` | `#D6CCBD` | `#BFB3A1` | — | — | — | — | — | — |
| `ink` | text, neutrals | `#F5F0E6` | `#ECE6DC` | `#DED8CE` | `#BDB5AA` | `#8F857A` | `#766D63` | `#5C554D` | `#463F38` | `#2F2A24` | `#1E1A16` | `#141210` |
| `terracotta` (geru) | **brand / primary** | `#FDF8F5` | `#FBF1EC` | `#F3D9CB` | `#E6B39A` | `#D4845F` | `#C76A41` | `#B9532E` | `#9E482B` | `#8C3B1E` | `#742E15` | `#4A1C0C` |
| `olive` (neem) | deep surfaces, secondary | `#F2F5F1` | `#E3E8E1` | `#C7D0C3` | `#A3B09E` | `#7C8C77` | `#5E6E59` | `#4A5946` | `#414D3E` | `#3A4438` | `#262E26` | `#1A201A` |
| `gold` (zari) | decorative accent, ratings | `#FDFAF0` | `#FBF3DB` | `#F3E2AE` | `#E8CB7A` | `#D9B24A` | `#C59B27` | `#B38029` | `#8F6420` | `#6E4C1A` | `#523914` | `#33230C` |
| `peacock` | **verification only** + success | `#E6F4F2` | `#D2EDE9` | `#A6D9D1` | `#6FBFB3` | `#3A9F92` | `#1A8A7D` | `#11756B` | `#0D5C54` | `#0A4A44` | `#083A35` | `#052522` |
| `danger` | errors | `#FDF2F2` | — | — | — | — | — | `#C0362C` | `#A02A21` | — | — | — |

### 3.2 Colour — semantic aliases (what components use)

| Token (utility) | Value | Use |
|---|---|---|
| `--color-bg` (`bg-bg`) | `khadi-50` | Page background |
| `--color-surface` (`bg-surface`) | `#FFFFFF` | Cards, inputs, sheets |
| `--color-surface-alt` (`bg-surface-alt`) | `khadi-100` | Parchment bands (alternating sections, footer-top, filters sidebar) |
| `--color-surface-deep` (`bg-surface-deep`) | `olive-900` | Testimonial panel, admin sidebar, dark bands |
| `--color-line` (`border-line`) | `sand-200` | Default hairline borders |
| `--color-line-strong` (`border-line-strong`) | `sand-300` | Input borders, card borders on parchment |
| `--color-text` (`text-text`) | `ink-900` | Body text |
| `--color-muted` (`text-muted`) | `ink-600` | Secondary text (≥ 6.9:1 on khadi) |
| `--color-subtle` (`text-subtle`) | `ink-500` | Captions and meta text (≈4.8:1 on khadi) |
| `--color-brand` (`bg-brand`, `text-brand`) | `terracotta-800` | Primary buttons, links, active states |
| `--color-brand-hover` | `terracotta-900` | Hover/pressed |
| `--color-brand-soft` | `terracotta-50` | Tinted backgrounds, selected rows |
| `--color-accent` | `gold-500` | **Decorative only**: stars, hairline ornaments, emblem |
| `--color-verified` | `peacock-700` | Karu Verified badge, success |
| `--color-verified-soft` | `peacock-50` | Proof panels |
| `--color-unverified` | `ink-500` | "Not verified yet" pill (neutral, never red) |
| `--color-danger` | `danger-600` | Errors |
| `--color-on-dark` | `khadi-50` | Text on terracotta, olive, photos |

### 3.3 Colour rules
- **Terracotta replaces indigo as the brand colour everywhere**, including the seller studio and admin (fixes A1). `indigo-*` classes are migrated to `brand` / `ink` (map in section 9.1), then the indigo tokens are deleted. `haldi` merges into `gold`.
- **Peacock is reserved for proof.** Only verification, success states and the "Karu Verified" filter use it, so the colour itself comes to mean "proven".
- **Gold is never text on light backgrounds** (`gold-500` on white is 2.6:1). Use it for stars, the emblem, ornaments, or as text only on `olive-900` / `terracotta-900`.
- **Contrast pairs (checked):** brand on khadi 7.2:1 · white on brand 7.6:1 · `ink-600` on khadi 6.9:1 · white on peacock-700 7.8:1 · khadi on olive-900 13:1 · `ink-400` on khadi **3.4:1** (placeholders and disabled only, never body).
- Photos carrying text get a gradient scrim (`from-ink-950/55`) and text in `on-dark`.

### 3.4 Typography

**Faces (unchanged families, new settings):**
- **Display / editorial:** Fraunces, variable, load with `axes: ["opsz"]`, weights **350–500**, `font-optical-sizing: auto`. Use light weights at large sizes to get the high-contrast Mrittika look. Italic for accent words. Indic/Urdu fallbacks stay: Noto Serif Devanagari, Noto Nastaliq Urdu.
- **UI / body:** Noto Sans + per-script Noto Sans (unchanged). Premium feel comes from size, weight and tracking, not a new font, so Latin and Indic lines keep matching metrics.
- **Numerals:** `font-variant-numeric: tabular-nums` on prices, quantities, Karu IDs and stats.
- **Mono:** `ui-monospace` for Karu IDs (`KRU-…`) only.

**Type scale** (utility → desktop / mobile, line-height, tracking):

| Utility | Desktop | Mobile | LH | Tracking | Face / weight | Use |
|---|---|---|---|---|---|---|
| `text-display-xl` | 72 | 40 | 1.02 | -0.02em | Fraunces 350 | Home hero headline |
| `text-display` | 56 | 34 | 1.05 | -0.015em | Fraunces 350 | Page heroes (craft, maker, edit) |
| `text-h1` | 44 | 30 | 1.1 | -0.01em | Fraunces 400 | Page titles, PDP title |
| `text-h2` | 36 | 26 | 1.15 | -0.01em | Fraunces 400 | Section titles ("New Collection") |
| `text-h3` | 24 | 20 | 1.25 | 0 | Fraunces 450 | Card-group titles, sheet titles |
| `text-h4` | 18 | 17 | 1.3 | 0 | Fraunces 500 | Product card title, sub-sections |
| `text-body-l` | 18 | 17 | 1.6 | 0 | Sans 400 | Hero sub-copy, story text |
| `text-body` | 16 | 16 | 1.55 | 0 | Sans 400 | Default |
| `text-body-s` | 14 | 14 | 1.5 | 0 | Sans 400/500 | Secondary, table cells |
| `text-caption` | 12 | 12 | 1.4 | 0.01em | Sans 500 | Meta, timestamps (**minimum size anywhere**) |
| `text-eyebrow` | 12 | 11.5 | 1.2 | 0.2em, uppercase | Sans 600 | Section eyebrows, nav labels, buttons |
| `text-price` | 22 | 20 | 1.2 | 0 | Sans 600 tabular | PDP price (card price uses `text-body` 600) |

- Indic line heights: keep `--lh-body` overrides (1.68 Indic, 1.8 Urdu). **Eyebrows and uppercase do not apply to Indic/Urdu.** `:lang(hi|pa|mr|gu|ta|ml|ur) .text-eyebrow { text-transform:none; letter-spacing:0.02em; font-size:13px }`.
- Reading width: prose `max-w-[68ch]`. Section intros `max-w-[46ch]`.
- Remove all `text-[Npx]` usages (fixes A3, A9).

### 3.5 Space, grid, breakpoints

- **Base 4 px.** Spacing scale used in design: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128.
- **Breakpoints** (Tailwind defaults): `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Design at **360, 390, 768, 1024, 1280, 1440, 1920**.
- **Containers:**
  - `container-page`: `max-w-[1320px]` content with gutters **16 / 24 / 40 / 56** (`base / md / lg / xl`).
  - `container-wide`: `max-w-[1600px]` for full-bleed photo strips that still need edges on ultra-wide screens.
  - `container-prose`: `max-w-[720px]`.
- **Grid:** 4 columns mobile · 8 tablet · 12 desktop, gutter 16 / 24 / 32.
- **Section rhythm:** vertical padding `py-14 md:py-20 lg:py-24`. Section header to content `mb-8 lg:mb-10`.
- **Header heights:** announcement 36 px (desktop) / 32 px (mobile); main header 80 px desktop → 64 px when scrolled; 56 px mobile.

### 3.6 Shape, borders, elevation

| Token | Value | Use |
|---|---|---|
| `--radius-none` | 0 | Full-bleed bands, hero, editorial images |
| `--radius-xs` | 2px | **Buttons, inputs, selects, chips (filter)** |
| `--radius-sm` | 4px | Product cards, image frames, banners, tiles |
| `--radius-md` | 8px | Sheets/dialogs (desktop), toasts, popovers |
| `--radius-lg` | 16px | Mobile bottom-sheet top corners, passport card |
| `--radius-full` | 9999 | Avatars, category portals, icon buttons, badges/pills, counters |

- **Borders do the work.** Default 1 px `border-line`. Cards on parchment use `border-line-strong`.
- **Shadows:** only three. `--shadow-pop` for menus/popovers (`0 12px 32px -8px rgb(30 26 22 / .18)`), `--shadow-sheet` for dialogs/drawers, `--shadow-lift` for card hover on desktop (`0 10px 28px -12px rgb(30 26 22 / .22)`). Delete `shadow-soft`, `shadow-editorial`, `deckle-card`, `shadow-2xs` usages.

### 3.7 Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(.2,.7,.2,1)` | Default |
| `--dur-fast` | 150ms | Hover colour, focus |
| `--dur-base` | 220ms | Menus, drawers, accordions |
| `--dur-slow` | 600ms | Hero crossfade, image hover zoom (scale 1.03) |
| `animate-settle` | existing | Verified badge appears |
| `animate-reveal` | opacity 0→1, translateY 8→0, 500ms | Section reveal on first scroll-in, once; via a tiny `useReveal` IntersectionObserver hook |

No animation library. Everything respects `prefers-reduced-motion` (existing global rule). Mega menus open on hover **with 120 ms intent delay**, and on click/Enter for keyboard.

### 3.8 Texture & ornament assets (new, in `components/karu/ornaments.tsx`, server-safe)

- `Woven` (existing): thin over-under stitch line, used as a micro-divider in proof panels, passport and the `/k` header band.
- `DeckleEdge`: inline SVG torn-paper edge (top or bottom, fill = next section's colour), 24 px tall, `aria-hidden`.
- `Emblem`: the Karu sun mark as a standalone SVG (above centred wordmark, in empty states, as a watermark on the Edit banner at 6% opacity).
- `PaperGrain`: CSS-only grain on `surface-alt` bands (`background-image` SVG `feTurbulence` data URI, under 1 KB, 3% opacity). Off on `/k` to keep the page budget.
- Spot illustrations (existing `SpotArt`: loom, basket, thread) + 3 new: `wheel` (pottery), `needle` (embroidery), `parcel` (orders/empty bag). Stroke `brand`, accent `accent`.

### 3.9 Iconography
- lucide-react, **1.5 px stroke** (`strokeWidth={1.5}`) at 20 px (24 px on artisan side). Set via a wrapper `Icon` or consistent props.
- Directional icons (`ArrowRight`, `ChevronRight`) always get `flip-rtl`.
- Category line icons (`category-icon.tsx`) restyled to 1.5 px and used in the mega menu, filter lists and the artisan category picker.

### 3.10 `@theme` sketch (to land in Phase 0)

```css
@import "tailwindcss";

@theme {
  /* primitives — full ramps; see §3.1 for every value */
  --color-khadi-50: #fbf8f2;  --color-khadi-100: #f6f0e6; --color-khadi-200: #eee5d6; --color-khadi-300: #e2d6c3;
  --color-terracotta-50: #fdf8f5; /* … */ --color-terracotta-800: #8c3b1e; --color-terracotta-900: #742e15;
  /* … ink, sand, olive, gold, peacock, danger … */

  /* semantic */
  --color-bg: var(--color-khadi-50);
  --color-surface: #ffffff;
  --color-surface-alt: var(--color-khadi-100);
  --color-surface-deep: var(--color-olive-900);
  --color-line: var(--color-sand-200);
  --color-line-strong: var(--color-sand-300);
  --color-text: var(--color-ink-900);
  --color-muted: var(--color-ink-600);
  --color-subtle: var(--color-ink-500);
  --color-brand: var(--color-terracotta-800);
  --color-brand-hover: var(--color-terracotta-900);
  --color-brand-soft: var(--color-terracotta-50);
  --color-accent: var(--color-gold-500);
  --color-verified: var(--color-peacock-700);
  --color-verified-soft: var(--color-peacock-50);
  --color-on-dark: var(--color-khadi-50);

  /* type scale: --text-<name> + --text-<name>--line-height + --text-<name>--letter-spacing */
  --text-display-xl: 2.5rem; --text-display-xl--line-height: 1.02; --text-display-xl--letter-spacing: -0.02em;
  /* desktop sizes switch via @media in a `.text-display-xl` layer or with responsive utilities `lg:text-[…]` wrapped in the component */

  --radius-xs: 2px; --radius-sm: 4px; --radius-md: 8px; --radius-lg: 16px;
  --shadow-pop: 0 12px 32px -8px rgb(30 26 22 / .18);
  --shadow-lift: 0 10px 28px -12px rgb(30 26 22 / .22);
  --ease-out: cubic-bezier(.2,.7,.2,1);
}
```

Responsive type: define mobile values in `@theme` and the desktop step in `@layer utilities` with `@media (width >= 64rem)` for each `text-display*`/`text-h*` utility. Components then write `text-h2` once instead of `text-2xl sm:text-3xl lg:text-[40px]`.

**Guardrail:** add `scripts/check-tokens.mjs` (`npm run check:tokens`, in CI next to `check:i18n`). It fails on (a) colour classes whose token isn't defined in `globals.css`, (b) `#hex` inside `className`, (c) `text-[Npx]` / `rounded-[Npx]`, (d) physical direction classes (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left/right`). This stops A2, A3 and A10 from coming back.

---

## 4. Layout architecture

### 4.1 Route-group shells

| Shell | Routes | Desktop (≥ 1024) | Mobile |
|---|---|---|---|
| **Market** | `(market)/*` | Announcement + header + full-width `<main>` (no max-width) + footer | Header 56 px + bottom nav (hidden on `/p/*`, `/cart`, `/checkout`, where a sticky action bar replaces it) |
| **Checkout** (new nested layout) | `/checkout`, `/order/[id]/success` | Minimal header (wordmark + "Secure checkout" + step indicator), no footer links | Same, compact |
| **Account** (new nested layout) | `/account/*` | Market chrome + 2-column: 264 px side nav + content | Market chrome; account home is the nav list |
| **Proof** | `/k/*` | Stand-alone, server-only, no providers (unchanged rule) | same |
| **Seller studio** | `/sell/*` | 248 px left sidebar + 64 px top bar + content up to 1200 px | Header + bottom nav with FAB (as today) |
| **Staff console** | `/admin/*` | 232 px olive sidebar + content, dense | Top bar + horizontal scroll nav (as today) |

### 4.2 Section primitive (fixes A8, A12)

New server components in `components/layout/`:

```tsx
<Section tone="bg | alt | deep | brand" bleed? pad="default | tight | none" id? labelledBy?>
  <Container size="page | wide | prose">…</Container>
</Section>

<SectionHeader
  eyebrow="Shop the look"        // i18n
  title="New collection"          // renders h2 with text-h2
  accentWord?="Heart"             // optional italic terracotta word
  intro?="…"
  action={{ href: "/search?sort=new", label: t("view_all") }}
  align="split | center"
/>
```

`(market)/layout.tsx` drops its `max-w` wrapper. Pages compose `Section` + `Container`, so bands go edge-to-edge and content stays aligned to one grid.

---

## 5. Global chrome

### 5.1 Announcement bar — `AnnouncementBar` (replaces `TopBanner`)
- `bg-brand text-on-dark`, `text-eyebrow`, 36 px. Three i18n messages (`nav.announce.1–3`). Desktop shows all three separated by a `•` in `gold-300`. Mobile auto-rotates one at a time (5 s, pauses on hover/focus, no rotation under reduced motion).
- Desktop end side: "Sell on Karu" · "Track order" · language code (`EN ▾` opens `LanguageSwitcher` popover).
- Dismissible on mobile (session storage), always shown on desktop. Hidden once the header shrinks on scroll.

### 5.2 Header — `MarketHeader` (rebuild)

**Desktop ≥ 1024 (Terra & Soul layout, Mrittika restraint):**

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ SHOP ▾   CRAFTS ▾   REGIONS ▾   MAKERS      [☀ KARU ]      🔍  ♡  👤  🛍 2 │
│                                           Handmade · Proven                 │
└───────────────────────────────────────────────────────────────────────────────┘
```
- Three zones on a 12-col grid: nav (start, 5 cols), wordmark (centre, 2 cols), actions (end, 5 cols). 80 px, `bg-bg/95 backdrop-blur`, bottom hairline. Shrinks to 64 px after 80 px scroll (wordmark tagline fades out).
- Nav labels `text-eyebrow`, active = 1 px terracotta underline 6 px below (Mrittika "New Collection" underline).
- Actions are 44 px icon buttons. The search icon opens `SearchOverlay`. Cart badge is a terracotta circle with tabular count. Signed-in account shows the initial in a 28 px avatar.
- **Mega menus** (`MegaMenu`, server-rendered content, client hover/keyboard logic only):
  - **Shop**: 3 link columns (*Wear*: Sarees, Dupattas & stoles, Kurtas & fabric · *Home*: Home textiles, Pottery & terracotta, Woodcraft, Metal & brass, Bamboo & cane · *Art & adornment*: Paintings, Jewellery, Toys, Leather) with category icons, plus a feature tile (current Karu Edit image + title + "Explore").
  - **Crafts**: GI crafts grouped by region (Banarasi brocade — Varanasi, Bhagalpuri silk — Bihar …), GI chip, "All crafts" link.
  - **Regions**: states that have makers (from `/catalog/crafts` regions), each linking to `/search?state=…`, with a small illustrated India outline (static SVG) highlighting on hover.
  - Full-width panel under the header, `bg-surface`, `shadow-pop`, 220 ms fade/slide, closes on Esc / pointer-leave / route change. `aria-expanded` on triggers.
- **Makers** links to `/makers` (new directory page, section 7.1 B18).

**Tablet 768–1023:** wordmark start, search field (expanding) centre, actions end. Nav moves into the drawer.

**Mobile < 768:**
```
┌──────────────────────────────┐
│ ☰        ☀ KARU         🔍 🛍│  56 px
└──────────────────────────────┘
```
- `☰` opens `NavDrawer` (start side; end side in RTL): accordion sections (Shop, Crafts, Regions), Makers, How verification works, language switcher, Sell on Karu, Sign in / account.
- Bottom nav (`MarketBottomNav`) stays: **Home · Shop · Search · Wishlist · Account**. Restyle: 60 px, 22 px icons, 11 px → **12 px** labels, active = terracotta icon + 2 px top indicator. Hidden on PDP/cart/checkout.

### 5.3 Search — `SearchOverlay` (new; reuses `search-suggest.tsx` logic)
- Desktop: panel drops below the header, `container-page`. Big borderless input in Fraunces 28 px with placeholder "Search sarees, crafts, makers… बनारसी". Underneath, three columns: **Suggestions** (live, with transliteration hint "Showing results for *banarasi*"), **Popular crafts** (chips), **Recent searches** (local, clearable). Plus a row of 4 product thumbnails for the top live hit.
- Mobile: full-screen sheet, input pinned top, same groups stacked, keyboard-safe.
- Enter goes to `/search?q=`. Esc closes. `role="combobox"` + listbox semantics.

### 5.4 Footer — `MarketFooter` (rebuild)
```
DeckleEdge (khadi → terracotta)
┌ bg-brand text-on-dark ───────────────────────────────────────────────────┐
│ ☀ KARU                     │ Join the Karu Circle                        │
│ Handmade in India · Proven │ New drops and maker stories, twice a month. │
│ [Instagram][YouTube][WA]   │ [ your email                ][ → ]          │
├────────────────────────────┴─────────────────────────────────────────────┤
│ SHOP            CRAFTS & REGIONS     KARU                 HELP           │
│ All categories  Banarasi             About                Help centre    │
│ Sarees          Bhagalpuri silk      How verification…    Shipping       │
│ Pottery         Kutch embroidery     Impact               Returns        │
│ Brass & metal   Madhubani            Sell on Karu         Track order    │
│ Verified only   All crafts →         For businesses       Contact        │
├──────────────────────────────────────────────────────────────────────────┤
│ 🌐 English ▾   UPI · RuPay · Visa · Mastercard · Netbanking   Made in India  © 2026 Karu │
└──────────────────────────────────────────────────────────────────────────┘
```
- Column headings `text-eyebrow text-gold-200`. Links `text-body-s text-on-dark/85 hover:text-on-dark` underline-offset-4.
- Mobile: brand + newsletter stacked, link columns become accordions (`<details>`), bottom row wraps. Extra bottom padding only when the bottom nav is visible.
- Newsletter is wired to a real endpoint, or **hidden** until one exists (today it only flips local state, which misleads users; see section 10.2).
- Payment marks are monochrome text chips (avoids third-party logo licensing).

---

## 6. Component library — every component

Legend: **Keep** (only token clean-up) · **Restyle** (same API, new look) · **Rebuild** (new API/structure) · **New**.

### 6.1 Primitives (`components/ui.tsx` → split into `components/ui/*.tsx`, barrel re-export keeps imports working)

| Component | Action | Spec |
|---|---|---|
| `Button` | Rebuild | Variants: `primary` (bg-brand, on-dark), `secondary` (1 px ink-900 border, transparent → ink-900 fill on hover, the Mrittika "Shop the collection" outline), `ghost` (text, brand-soft hover), `link` (eyebrow text + animated underline + `ArrowRight`), `danger`, `verified` (peacock, only for "Get verified" actions). Sizes `L` 52 px / `M` 44 px / `S` 36 px, **radius-xs**, label `text-eyebrow` (sentence case for Indic). `icon`/`iconEnd`, `loading`, `block`. Artisan side defaults to `L`. Remove `active:scale`. Press feedback is the darker colour. |
| `IconButton` | New | 44 px (48 px artisan) circle, `aria-label` required, `variant: plain | surface | overlay` (white/90 on photos). |
| `TextLink` | New | Inline link with underline-offset-4, `brand` colour; `arrow` prop. Replaces ~20 hand-rolled "See all →" links. |
| `Input`, `Textarea`, `Select` | Restyle | 48 px, radius-xs, `border-line-strong`, focus = 1 px brand border + 3 px `brand/15` ring, `text-body`. Error = danger border + message. `Select` gets a custom chevron (`appearance-none`) that respects RTL. Add `prefix`/`suffix` slots (₹, +91, unit). |
| `Field` | Restyle | Label `text-body-s font-medium` (no uppercase), hint `text-caption text-muted`, error with icon. `required` marker. |
| `Checkbox`, `Radio`, `RadioCard` | New | 20 px, radius-xs / full, brand fill. `RadioCard` = bordered selectable tile (payment methods, address picker, shipping options). |
| `Switch` | Restyle | Track `sand-300` → `brand` (not peacock, which is reserved for proof). 44×24. |
| `Chip` | Rebuild | Two kinds: `FilterChip` (radius-xs, outline, selected = ink-900 fill, removable `×`) and `Tag` (static, see badges). |
| `Tabs` | Restyle | Underline tabs, `text-eyebrow`, 2 px brand indicator that animates position; `variant="pills"` for the seller dashboard filters; vertical variant for desktop seller product manage. Keyboard arrows (roving tabindex). |
| `Accordion` | New | `<details>`-based, server-safe. Hairline separators, `+`/`–` icon, used on PDP details, footer mobile, filters, FAQ. |
| `Breadcrumbs` | New | `text-caption`, `/` separators in `ink-300`, last item `aria-current`. Collapses to "← Category" on mobile. |
| `Sheet` | Rebuild → `Dialog` + `Drawer` | Same native `<dialog>` base. `Dialog` (centred, radius-md, max-w 560/720). `Drawer` (side: `end` for mini-cart & filters on desktop, `start` for nav; `bottom` on mobile with radius-lg top and a drag handle). Sticky footer slot for actions. |
| `Popover` / `Menu` | New | For language switcher, sort, account menu. Anchored, `shadow-pop`, radius-md, Esc/outside close, arrow-key items. |
| `Tooltip` | New | For icon-only buttons on desktop and price-advice dots. CSS + `aria-describedby`. |
| `Toast` | Restyle | Bottom-centre mobile (above sticky bars), bottom-end desktop. ink-900 bg, on-dark text, optional action ("View bag"). radius-md. |
| `Banner` | Restyle | Tones `info` (surface-alt), `warn` (gold-50 / gold-800 text), `success` (verified-soft), `danger`. Left 3 px rule in tone colour instead of full border. |
| `Skeleton` | Restyle | `sand-100` with a slow shimmer (off under reduced motion). Ready-made shapes: `CardSkeleton`, `RowSkeleton`, `TextSkeleton`. |
| `EmptyState` | Restyle | Spot illustration, `text-h3` title, `text-body` copy, one action button. Size `sm` (inside panels) / `lg` (page). |
| `Stars` | Restyle | Gold fill, `ink-200` empty; sizes 14/16/20; `RatingSummary` (avg + count + "verified purchases"). |
| `Stepper` | Restyle | Horizontal on desktop (checkout, order timeline, seller onboarding), vertical on mobile/verification layers. Done = brand check, current = brand ring, warn = gold. |
| `ProgressRing` | Keep | Token colours. |
| `QuantityStepper` | New | `– 1 +` with 44 px targets, radius-xs outline, min/max, `aria-live`. Used by cart, request-again, seller stock. |
| `Avatar` | New | Image or initials on `khadi-200`, sizes 24/32/40/56/96, optional verified ring (peacock 2 px). |
| `Img` / `ImageFrame` | New | Wraps `<img>` with an aspect-ratio box, `srcSet` from `ImageSet` (`thumb`/`card`/`large`), `sizes`, `thumb` as blurred placeholder background, `loading`/`fetchPriority`, graceful fallback (Emblem on parchment, not "Handcrafted Piece" text). One component for all product imagery. |
| `Pagination` / `LoadMore` | New | "Showing 24 of 132" + progress hairline + "Load more" secondary button; optional numbered pagination for SEO pages. |
| `StatTile` | New | Label (`text-caption` eyebrow), value (Fraunces 36 tabular), delta/hint; for seller + admin + impact. |
| `DataTable` | Rebuild (from admin `Table`) | Sticky header, zebra off, row hover `surface-alt`, `text-body-s`, sortable header buttons, responsive: below `md` turns into stacked cards via `renderCard`. |

### 6.2 Brand & proof components (`components/karu/*`)

| Component | Action | Spec |
|---|---|---|
| `Wordmark` | Rebuild | Props `layout: "centered" | "inline"`, `tone: "dark" | "light"`, `showTagline`. Emblem SVG (sun) + `KARU` in Fraunces 500, tracking 0.18em + tagline `text-eyebrow` **12 px** (was 8.5 px). Tagline i18n. |
| `VerifiedBadge` | Restyle | Pill, radius-full. `sm` 24 px (cards), `lg` 32 px (PDP, `/k`). Verified = peacock-700 + gold `BadgeCheck`. Not verified = `ink-100` bg + `ink-600` text + dashed-circle icon (neutral, readable). Checking = animated dots. Revoked = `danger` icon on ink-100. **Overlay variant** for photos: white/92 bg, peacock text. |
| `GiTag` | New | Small zari-outlined tag "GI · Banarasi brocade", gold-800 text on gold-50. |
| `ProductTag` | New | Square tags on card corners (Mrittika "New", "Best Seller"): `new`, `low_stock` ("Only 2 left", terracotta), `out` ("Sold out", ink), `made_to_order`. radius-xs, white/95 bg, `text-caption` 600. |
| `StockPill` | Restyle | Becomes text + dot on PDP ("● In stock · ships in 3 days"); cards use `ProductTag`. |
| `ProofChecks` | Restyle | Check icons in peacock circles, text `text-body`. "How we checked" accordion. Desktop variant renders the checks in a 3-column row inside the provenance panel. |
| `KaruIdChip` | New | `KRU-XXXX` mono in a hairline box with a tiny QR glyph. Copies on click (desktop) and links to `/k/`. |
| `ProvenancePanel` | New (extracted from PDP) | Header "Proof of handmade" + `KaruIdChip` + `ProofChecks` + making-video thumbnail + "View certificate →". Woven divider on top. `verified-soft` background when verified, `surface` otherwise. |
| `PassportCard` | Restyle | Luxury label: `olive-900` or `terracotta-900` background, woven border in zari, maker photo in an arch-topped frame (the arch nods to haveli windows), name in Fraunces, KRP ID mono, member since, verified pieces, rating. Export-as-image keeps working (canvas). |
| `MakerCard` | Rebuild | Variants: `compact` (avatar 40, name, place, passport chip, follow), `feature` (PDP "Meet the maker" band: 4:5 portrait, quote in Fraunces italic, stats, Follow + Listen + "All pieces by …"), `tile` (maker directory/following grid: square portrait, name, craft, place, piece count). |
| `ListenButton` | Restyle | Secondary button with waveform glyph that animates while playing; shows duration; transcript link. |
| `FollowButton` | Restyle | Secondary → "Following ✓" (brand-soft). |
| `PriceRangeBar` | Restyle | Track `sand-200`, replica range `ink-300` hatched, handmade range `terracotta-300 → terracotta-600` gradient, price marker `ink-900` pin with label, sources popover. |
| `LanguageSwitcher` | Rebuild | Popover listing all 8 languages in native script + English name, current ticked. Inline trigger "EN ▾" for header/footer, full-width list for drawer and artisan onboarding (A01 tiles stay). |
| `VoiceField`, `MicButton`, `SpeakerButton` | Restyle | MicButton: 56 px brand circle, listening = `animate-pulse-ring` in brand + live waveform; processing spinner; error state with retry. VoiceField: Input + MicButton inside the suffix slot on desktop, beside it on mobile. |
| `Ornaments` (`DeckleEdge`, `Woven`, `Emblem`, `PaperGrain`) | New/Keep | Section 3.8. |

### 6.3 Commerce components (`components/market/*`)

| Component | Action | Spec |
|---|---|---|
| `ProductCard` | Rebuild | **Variants:** `grid` (default, Mrittika: image 4:5 with radius-sm, **bordered info panel below** on desktop: maker eyebrow → title `text-h4` 2 lines → price row with `+` quick-add circle at end), `rail` (same without border, for horizontal rails), `editorial` (large, 3:4, text overlaid on scrim, for edits), `row` (cart/order/wishlist line: 96 px image + text + actions), `mini` (search overlay / recently viewed: 64 px). **Overlays:** `ProductTag` top-start, wishlist `IconButton overlay` top-end (desktop shows on hover/focus; always visible on mobile), `VerifiedBadge overlay sm` bottom-start. **Desktop hover:** image crossfades to the 2nd gallery image (if any) at 600 ms, card gets `shadow-lift`, quick-add `+` fills brand. **Quick add:** adds to bag and opens `CartDrawer` (out of stock → "Request again" sheet). Card title uses `lang` attr. Whole card is one link; the buttons inside stop propagation. |
| `ProductGrid` | Restyle | Columns: 2 (base) / 3 (md) / 4 (lg) / 5 (2xl on home only). Gap-x 16/24, gap-y 32/48. `density` prop (`comfortable` / `compact`) for PLP toggle. |
| `ProductRail` | Rebuild | Scroll-snap row with **visible prev/next arrow buttons on desktop** (`IconButton surface`, disabled at ends), peek of next card on mobile, keyboard scrollable (`tabIndex=0`, `aria-roledescription="carousel"`). Card widths 160/220/260. |
| `CategoryPortal` (from `CategoryShowcase`) | Rebuild | Circle 96 (mobile) / 148 (desktop) with 4 px khadi gap ring + hairline outer ring, hover: ring turns brand + image scale 1.05. Label `text-eyebrow`, "Shop now" `text-caption` underline (Terra & Soul). **Images come from the API** (category cover = best verified listing photo), with no Unsplash. |
| `HeritageGrid` (from `HeritageProcess`) | Rebuild | Desktop 12-col: copy block 4 cols (eyebrow, `text-h2` "Rooted in heritage", body, TextLink), 4 tiles × 2 cols (4:3 photo, technique name `text-h4`, two-line caption, short rule). Mobile: copy then a 2×2 grid. Data from crafts API + making stills. |
| `RegionStrip` | New | Terra & Soul "Shop by Room": 6 tiles, desktop 6-col full-bleed (`container-wide`) at 3:4, each with a bottom label plate (khadi/95 bg, `text-eyebrow` "BHAGALPUR · BIHAR" + arrow). Mobile: horizontal scroll, 70% width tiles. |
| `EditBanner` | New | Mrittika "Heritage Edit": full-bleed 520 px (desktop) photo with a scrim on the start side; eyebrow, `text-display` title, short copy, secondary-on-dark button, and a vertical link list split by a hairline (Sarees / Dupattas / Kurtas / Gifting). Mobile: photo 4:5 on top, text block below on `surface-alt`. |
| `FeaturedRail` | New | Terra & Soul "Featured pieces": 12-col, intro column 3 cols (craft name `text-h2` with italic accent, region eyebrow, `GiTag`, heritage line, TextLink) + 4 products 9 cols. Mobile: intro on top, rail below. Used for each `craft_rails` entry, alternating intro side (start/end) for rhythm. |
| `MakerSpotlight` (from `ArtisanSpotlight`) | Rebuild | Split: 5 cols portrait (real maker photo, arch frame) / 7 cols story (eyebrow "The story behind every piece", `text-h2`, maker's own words in Fraunces italic `text-body-l` with a `lang` attr, place + craft + years, Listen + Meet the maker). Hides if no maker has photo + story. |
| `PatronVoices` (replaces `PatronTestimonials`) | Rebuild | Olive panel, eyebrow "Words from our patrons", 3 review cards (stars in gold, quote ≤ 180 chars in Fraunces italic, buyer first name + city, product link, "Verified purchase" chip). **Data from API only** (new `featured_reviews`). Fewer than 3 real reviews → section not rendered. |
| `ProvenanceSteps` (from the home 3-step cards) | Rebuild | Horizontal 3-step band on `surface-alt`: numbered Fraunces numerals `01 02 03` connected by a woven line; icons (Passport, Karu ID tag, QR scan); final CTA "Scan a sample Karu ID" → `/k/<demo>`; mobile vertical stepper. |
| `ImpactBand` | Rebuild | 4 `StatTile`s with Fraunces 56 numerals on khadi, hairline separators, one-line ledger note, TextLink to `/impact`. |
| `TrustStrip` | New | 4 icon + text items in a single hairline-bordered row (Karu ID on every piece · Paid directly to the maker · Free shipping over ₹999 · Returns on returnable pieces). Mobile: 2×2. |
| `Browse` (PLP) | Rebuild | Section 7.1 B02/B04. Split into `FilterPanel`, `ActiveFilters`, `SortMenu`, `ResultsToolbar`, `ResultsGrid`. |
| `FilterPanel` | New | Accordion groups; **Karu Verified toggle pinned top** in a verified-soft box; category/craft/region as radio lists with counts (single-value API today; checkboxes when multi-select lands), price range (two `Input` with ₹ prefix + preset chips "Under ₹1,000 / ₹1,000–3,000 / ₹3,000+"), material chips, returnable/in-stock/4★ switches. Desktop: 264 px sticky sidebar on `surface-alt`. Mobile: bottom `Drawer` with sticky "Show 132 results" footer and "Clear all". |
| `ProductGallery` | Rebuild | Desktop: vertical thumb rail (72 px, start side) + main 4:5 image. Hover-zoom lens 2× (pointer: fine only), click → fullscreen `Lightbox` with arrow keys. Making video = thumb with ▶ badge "Watch it being made" (verified only). Mobile: full-bleed swipe (scroll-snap) with dot/line indicator `1 / 6`, tap → lightbox, pinch-zoom via native. |
| `BuyBox` | Rebuild | Desktop (sticky in right column): price `text-price` + stock line, intl approx line, quantity stepper (if stock > 1), **Add to bag** (primary L block), **Buy now** (secondary L block), row of wishlist + share icon buttons, `DeliveryCheck` (PIN input → "Delivers by Thu, 31 Oct" placeholder copy until the API exists), returns line. Mobile: inline version in flow + `StickyBuyBar` (price + Add to bag) pinned at the bottom (replaces bottom nav on PDP), appears after the inline buttons scroll out of view. Out of stock: "Request this again" primary + "Notify me" ghost. |
| `CartDrawer` | New | End-side drawer on desktop (420 px), full-height bottom drawer on mobile: maker-grouped lines (`ProductCard row`), subtotal, "100% of item price goes to the makers" note, "View bag" secondary + "Checkout" primary. Opens on add-to-bag. |
| `ProductReviews` | Rebuild | Desktop 12-col: 4 cols summary (avg in Fraunces 56, stars, count, 5→1 histogram bars in gold, "Only verified buyers can review" note) + 8 cols list (cards with stars, text, photos strip, buyer first name + city + date, "Verified purchase"). Sort (Most recent / With photos). Mobile stacked, 3 shown + "See all" drawer. |
| `StoryToggle` | Restyle | "Translated from Maithili · Show original" as an inline `TextLink`. Story text `text-body-l` max 68ch. |
| `RecentlyViewed` | Restyle | Uses `ProductRail` with `mini`/`rail` variant + "Clear" link. |
| `MakerStrip` | Restyle | Row of `MakerCard tile` with rail behaviour; used on craft pages and home fallback. |
| `AddressForm` | Restyle | Two-column grid on desktop (name / phone, PIN / city, state select, address lines full width, landmark), PIN autofill of city/state (client lookup table) and "Use as default" checkbox. |
| `ReportLink` | Restyle | Quiet `text-caption` link with flag icon; dialog uses `RadioCard` reasons. |
| `SearchSuggest` | Merge into `SearchOverlay` | Section 5.3. |
| `CategoryIcon` | Restyle | 1.5 px stroke. |
| `ViewTracker`, `order-types.ts` | Keep | — |
| `OtpLogin` | Restyle | OTP as 6 separate 52 px boxes (radius-xs) with auto-advance/paste, resend countdown as `text-caption`, method switch tabs (Phone / Email), Google button as `secondary` with logo. |
| `AuthGate` | Keep | Loading state uses page skeleton, not spinner. |

### 6.4 Seller studio components (`components/artisan/*`)

| Component | Action | Spec |
|---|---|---|
| `ArtisanShell` (from `ArtisanHeader` + `ArtisanBottomNav` + `SellPage`) | Rebuild | **Desktop:** `SellerSidebar` (248 px, `surface`, Wordmark + "Studio" tag, nav: Home, Products, Orders, Requests, Payouts, Passport, Help, Settings, with counts) + `SellerTopBar` (page title, search my products, language, notifications bell with badge, profile ring, **+ New product** primary). Content `max-w-[1200px]`. **Mobile:** existing header + bottom nav with centre FAB, restyled (FAB brand, 64 px, khadi ring). All targets ≥ 48 px, text ≥ 16 px. |
| `UploadQueueBanner` | Restyle | `Banner` tone warn/info with progress text and retry; desktop sits under the top bar, full width. |
| `Capture` (A06/A07) | Rebuild | Mobile unchanged flow (camera first). **Desktop:** two panels: start = drop zone ("Drag photos here or choose files", 6 slots grid with reorder by drag and keyboard), end = voice note card (big MicButton, prompt text + speaker, waveform, timer, playback) with a "Prefer to type?" textarea fallback. |
| `Review` (A08) | Rebuild | **Desktop:** 7/5 split. Start = editable field cards (title, description by language tabs, attributes table, category, images with AI shots toggles, `PriceRangeBar`). Each card has Edit / Speak / Regenerate actions in a consistent header row, and low-confidence fields get a gold left rule + hint. End = sticky **live preview** (`ProductCard grid` + a mini PDP header) so the artisan sees how buyers will see it. Mobile: stacked cards as today, restyled. |
| `Publish` (A09/A10) | Restyle | Final details as `RadioCard`s (returnable yes/no with nudge), `QuantityStepper`, making video uploader card. Success: Emblem + `animate-settle` badge, Karu IDs list (`KaruIdChip`s), share actions row. |
| `RunDetail` (admin) | Restyle | See 6.5. |

### 6.5 Staff console (`components/admin/*`)

| Component | Action | Spec |
|---|---|---|
| `AdminShell` | Restyle | Sidebar `surface-deep` (olive-900) with on-dark text, active item = `olive-700` bg + gold 2 px start rule. "STAFF" tag in gold. Content `bg-bg`, density: base `text-body-s`, 40 px controls. |
| `AdminTitle` | Restyle → `PageHeader` | Shared with seller studio: title `text-h1` (desktop 36), description, actions slot, optional tabs. |
| `Table` | Replace with `DataTable` | Section 6.1. |
| `TotpGate` | Restyle | Centred card on parchment with Emblem, 6-box OTP input. |
| `RunDetail` | Restyle | Layer scores as `StatTile`s + evidence list in `Accordion`, JSON in a mono code block. |
| `useReason` (window.prompt) | Rebuild | Replace `window.prompt` with a `Dialog` + required textarea (min 3 chars), so the reason is styled, translatable and accessible. |

---

## 7. Page-by-page redesign

Each screen keeps its existing data and API calls unless noted. "D" = desktop ≥ 1024, "M" = mobile < 768. Tablet follows desktop structure with fewer columns unless stated.

### 7.1 Marketplace (buyer)

#### B01 Home — `app/(market)/page.tsx`

Order and composition (D):

| # | Section | Component | Tone | Data |
|---|---|---|---|---|
| 1 | **Hero carousel**, full-bleed, 640 px tall. 5/7 split: copy on khadi start (eyebrow "Timeless Indian craftsmanship", `text-display-xl` "Made by hands. *Proven* by Karu.", `text-body-l` sub, primary "Explore the collection →", ghost "How Karu ID works"), photo bleeding to the end edge. Slide indicator `01 ——— 03` bottom-start. Vertical tagline end edge. Autoplay 7 s, pause on hover/focus, arrow buttons. | `HeroCarousel` (new; slide 1 server-rendered for LCP, others lazy) | bg | `home.hero_slides` (new) → fallback: top 3 verified picks' large images + craft names |
| — | `DeckleEdge` into section 2 | | | |
| 2 | Trust strip | `TrustStrip` | alt | static i18n |
| 3 | **Shop by craft**: 8 circular portals in one row | `SectionHeader center` + `CategoryPortal` ×8 | bg | `categories` + new `cover` image |
| 4 | **New & verified**: "Shop the look / New collection" + View all, 5-col grid (10 items, 2 rows) | `SectionHeader split` + `ProductGrid` (5 cols at 2xl, 4 at lg) | bg | `verified_picks` / `new_arrivals` tabs ("Verified picks · New arrivals" underline tabs) |
| 5 | **Rooted in heritage** technique grid | `HeritageGrid` | alt + `PaperGrain` | crafts + making stills (new `craft.cover`) |
| 6 | **Shop by region** | `RegionStrip` | bg, `container-wide` | crafts regions (+ cover) |
| 7 | **The Karu Edit** banner | `EditBanner` | bleed photo | `home.edit` (new) → fallback: hide |
| 8 | Craft rails ×N (alternating) | `FeaturedRail` | bg | `craft_rails` |
| 9 | **Story behind every piece** + **Words from our patrons** side by side (7/5) | `MakerSpotlight` + `PatronVoices` | bg + deep | `makers` + `featured_reviews` (new) |
| 10 | **How Karu proves it** | `ProvenanceSteps` | alt | static i18n + demo Karu ID |
| 11 | Impact | `ImpactBand` | bg | `impact` |
| 12 | Recently viewed | `RecentlyViewed` | bg | local |

M: hero becomes image-first (4:5 full-width photo, dots under it) then copy block + full-width primary button. Trust strip 2×2. Portals scroll horizontally (peek). New collection = 2-col grid, 4 items + "View all" button. Heritage 2×2. Region strip horizontal scroll. Edit banner stacked. Featured rails = intro + rail. Spotlight then Voices stacked. Section padding `py-14`.

#### B02 Category `/c/[category]` · B04 Search `/search` — `Browse`
- **Header band** (`surface-alt`, `py-10 lg:py-14`): Breadcrumbs, `text-display` category name (or "Results for *banarasi*" with transliteration note), one-line intro (category description, i18n), result count. Category pages also get a row of sub-craft `FilterChip` shortcuts (e.g., Sarees → Banarasi · Bhagalpuri · Chanderi · Kanjeevaram).
- **D:** 12-col: `FilterPanel` 3 cols sticky (top = header height + 16) | results 9 cols: `ResultsToolbar` (count · `ActiveFilters` chips with clear all · density toggle 3/4 · `SortMenu` popover), `ProductGrid`, `LoadMore` with "Showing 24 of 132".
- **M:** sticky toolbar under the header with **Filter (n)** and **Sort** buttons (each opens a bottom drawer), active filters as a scrollable chip row, 2-col grid.
- States: skeleton grid (8 `CardSkeleton`), empty (`basket` art + "Try fewer filters" + clear button + popular crafts chips), error with retry.
- Search with no query: shows "Popular crafts" chips + "Trending pieces" grid instead of an empty page.

#### B03 Craft & cluster `/craft/[slug]`
- **Hero** (full-bleed, 480 px): craft photo (making still) with scrim, eyebrow region(s), `text-display` craft name, `GiTag`, 2-line heritage summary.
- **D:** 12-col story section: 7 cols heritage text (prose, Fraunces drop-cap first letter) | 5 cols facts card ("GI registered 2009 · Region · Technique · Typical time to make · Materials") + India outline SVG with the region dot.
- **Makers of this craft:** `MakerStrip`.
- **Pieces:** embedded `Browse` with `fixed={{craft}}` (filters minus craft).
- M: hero 60vh, facts card below the story, accordion for the long heritage text ("Read more").

#### B05 Product `/p/[code]`
- **D (12-col):** Breadcrumbs. Gallery 7 cols | Info 5 cols **sticky**:
  1. Eyebrow: craft · region, `GiTag`
  2. `text-h1` title (`lang`), "by **Maker** · Place" with `Avatar 24`, `RatingSummary` (links to reviews)
  3. Price `text-price` + stock line, intl approx
  4. `VerifiedBadge lg` + `KaruIdChip` + "What does verified mean?" tooltip link
  5. `BuyBox`
  6. Trust rows (returns, delivery, "Paid directly to the maker")
- Below the fold, full width: **Accordion/tab group** (D: tabs, M: accordions): *The story* (StoryToggle + Listen), *Details & care* (attribute `dl` in 2 columns), *Proof of handmade* (`ProvenancePanel` with making video), *Shipping & returns*.
- **Meet the maker** band (`surface-alt`): `MakerCard feature`.
- Reviews (`ProductReviews`), **More from {maker}** rail, **Similar handmade pieces** rail, `ReportLink`.
- **M:** gallery full-bleed → title block → price/badge → inline BuyBox → trust rows → accordions → maker → reviews → rails. `StickyBuyBar` replaces the bottom nav.
- Out-of-stock and maker-under-review states styled as `Banner` above the BuyBox.

#### B06 Karu ID `/k/[karuId]` (keeps its performance budget)
- No new client JS, no `PaperGrain`, no mega menu. Root layout only. Only restyle with tokens.
- **Header band:** `olive-900` with `Woven` bottom edge, Wordmark light, Karu ID mono, verdict pill (`VerifiedBadge lg`).
- **D:** 2 columns (`max-w-5xl`): start = "Certificate of provenance" card: hero photo of this unit (4:5), title `text-h1`, craft · region, journey stepper (made → listed → sold → owned since) horizontal; end = maker (arch portrait, name, village, passport state, years, Listen) + `ProofChecks` + making video + market context line + actions ("Buy on Karu" / "See more from {maker}" / "Request this again").
- **M:** single column in the same order as spec §4.3.
- Sold-and-not-owner state: prominent `Banner warn` "This piece was sold on 3 Nov 2026" at the top.
- Budget check in CI: HTML < 60 KB, JS = islands only (`proof/islands.tsx`).

#### B07 Maker profile `/m/[handle]`
- **Cover band** (`surface-alt`, 360 px D): 4 cols arch portrait | 5 cols name `text-display`, craft · village · years, Follow + Listen, the maker's quote | 3 cols `PassportCard` (compact). `StatTile` row under it: Verified pieces · Rating · Buyer cities · Member since.
- **Tabs:** Pieces (`ProductGrid` + sort) · Story (long-form prose + photos) · Reviews (`ProductReviews` maker variant).
- M: portrait + name centred, passport card full width, tabs sticky under the header.

#### B18 Makers directory `/makers` (**new route**)
- Header band "Meet the makers" + filter chips by craft and state + search. Grid of `MakerCard tile` (4 cols D / 2 cols M). Needs `GET /makers?craft=&state=&cursor=` (section 10.2). Until it exists, the "Makers" nav item links to `/categories#crafts`.

#### B08 Cart `/cart`
- **D:** `text-h1` "Your bag (3)". 8/4 split. Start: groups per maker (header: `Avatar 32` + "From **Ramesh Kumar** · Bhagalpur, Bihar" + "Each piece ships with its Karu ID"), lines as `ProductCard row` (image 96, title, maker, `VerifiedBadge sm`, `QuantityStepper`, line price, "Move to wishlist" · "Remove" text actions). End: sticky `OrderSummary` card (subtotal, shipping, total `text-price`, "100% of the item price goes to makers" verified-soft note, **Checkout** primary L, payment marks, secure line).
- **M:** lines stacked, `StickyCheckoutBar` (total + Checkout).
- Empty: `basket` art, "Your bag is empty", "Explore verified pieces" + 4-item rail of recently viewed or verified picks.
- Unavailable line: muted image + `Banner warn` inline "This piece just sold out" + "Request again".

#### B09 Checkout `/checkout` (in the new Checkout layout)
- **Header:** Wordmark start, "Secure checkout 🔒" centre, Stepper (Address → Payment → Done) end.
- **D:** 7/5. Start: **1 Delivery address** (saved addresses as `RadioCard`s in a 2-col grid + "Add new address" tile → `AddressForm` drawer), **2 Contact** (email for receipt), **3 Payment** (`RadioCard`s: **UPI** highlighted first with app chips GPay · PhonePe · Paytm · BHIM, then Cards, Netbanking, Wallets, International cards), "Place order · ₹4,800" primary L. End: sticky summary grouped by maker, with "Who gets paid" lines (maker name → amount).
- **M:** collapsible summary bar at the top ("Show order summary · ₹4,800 ▾"), steps as stacked sections, sticky pay button.
- Error states (payment dismissed/failed/sold out) as `Banner` at the top of the payment step.

#### B10 Order success `/order/[id]/success`
- Centred `container-prose` on `surface-alt`: Emblem + `animate-settle` check, `text-h1` "Thank you. Your order is with the makers.", order number mono, "What happens next" horizontal stepper, **Your Karu IDs** (cards per piece: thumb, title, `KaruIdChip`, "Scan the tag when it arrives"), story-card preview with Download / Share, actions Track order / Continue exploring.

#### B11–B12 Account `/account/*` (new Account layout)
- **D:** 3/9 split. `AccountNav` sidebar: `Avatar 56` + name + phone/email masked, links with icons and counts (Orders, Wishlist, Following, Requests, Reviews, Addresses, Notifications, Settings), Sign out at bottom. Active link = brand text + start rule.
- **Account overview** (`/account`): greeting `text-h2`, `StatTile` row (Orders in transit, Wishlist, Makers followed), "Recent orders" (2 `OrderCard`s), "From makers you follow" rail, editable name in a `Settings` card (moved out of the overview header).
- **Orders** list: `OrderCard` (order no., date, status chip, maker-grouped thumbnails, total, "Track" / "Review" actions); filter tabs (All · In progress · Delivered · Returns).
- **Order detail:** D 8/4: start = horizontal `Stepper` timeline (Paid → Packing → Shipped → Delivered) with dates, items with `KaruIdChip`, actions (Return / Review / "Not received?"); end = address card + payment summary. M: vertical timeline.
- **Wishlist:** `ProductGrid` 4 cols with "Move to bag" on hover.
- **Following:** `MakerCard tile` grid + "New from these makers" rail.
- **Requests:** list of make-again requests as cards with status chip and maker reply.
- **Reviews:** list with product thumb + stars + text + edit.
- **Addresses:** card grid (2 cols) + "Add address" dashed tile; default tag.
- **Notifications:** grouped by day, unread dot, mark-all-read.
- **Settings:** sections in cards (Profile, Language, Notifications channels, Privacy, Delete account in danger zone).
- **M:** `/account` = profile header + nav list (current pattern, restyled); each sub-page full width with a back link.

#### B13 Login `/login`
- **D:** 50/50 split: start = full-height photo (maker's hands at a loom, from Karu's own media) with an Emblem + quote overlay; end = centred card (max 420): Wordmark, `text-h2` "Welcome to Karu", `OtpLogin`, Google, terms line.
- **M:** short photo header (160 px) with the card overlapping it.

#### B14 Business `/business`
- Editorial hero ("Handmade, at scale, with proof"), 3 benefit tiles (verified makers, Karu IDs on every unit, fair pricing), the form in a 2-column card (`AddressForm`-style grid), FAQ accordion.

#### B15 Impact `/impact`
- Hero numerals (`ImpactBand` large), "Where the money goes" bar visual (CSS only), maker stories grid (`MakerCard feature` ×3), clusters map (static SVG with dots by state), methodology accordion.

#### Static pages `/[page]` (about, help, terms, privacy, verification-explained)
- `ArticleLayout`: header band (eyebrow + `text-display` title + updated date), D 3/9 with a sticky table of contents (from h2s) | prose `container-prose` (Fraunces h2/h3, 18 px body, figure styles, callout `Banner`). `verification-explained` gets the `ProvenanceSteps` component and an interactive sample `/k` link.

#### B16 Request again · B17 Review (sheets)
- `Drawer`/`Dialog` with `QuantityStepper`, date input, note; Review = `Stars` input (48 px targets), textarea with counter, photo upload tiles (3), "Only verified buyers can review" note.

#### Categories `/categories`
- Header band "Shop by craft". All categories as large `CategoryPortal` grid (4 cols D, 3 cols M), then "Crafts & clusters" as `FeaturedRail`-style cards (3 cols D) with region + `GiTag` + piece count.

### 7.2 Seller studio (`/sell/*`) — mobile-first, now with desktop

Global: `ArtisanShell` (section 6.4). Body 16 px minimum, `L` buttons, mic on every input, speaker on key screens, light theme only, every list has a skeleton, an empty state with illustration, an error with retry and an offline state.

| ID | Route | Desktop layout | Mobile changes |
|---|---|---|---|
| A01–A04b | `/sell/start` | Split: start = full-height warm photo + "Sell your craft to all of India" + 3 benefits; end = step card (max 480) with progress dots: Language tiles (2×4 grid, native script large) → Phone → OTP → Details (one question per step, VoiceField) → Consent (voice-narrated summary card). | Restyle only. Tiles 2 cols, 64 px tall. |
| A05 | `/sell` home | Top: greeting `text-h2` + date; **3 `StatTile`s** (Views today · Orders to ship · Money on the way); action `Banner`s; then 8/4: **Products** (filter `Tabs pills`: All · Live · Not verified · Drafts · Paused; table/grid toggle; `DataTable` columns: photo, title, price + advice dot with tooltip, stock, `VerifiedBadge`, views, actions menu) / sidebar: `PassportCard` compact + profile completion card + Requests preview (3) + Impact mini ("₹38,400 earned · 21 pieces · 9 cities"). | Same content stacked; products as cards; FAB. |
| A06–A10 | `/sell/new` | `Capture` and `Review` desktop layouts (section 6.4), stepper across the top (Photos → Voice → Review → Publish). | Unchanged flow, restyled. Offline banner stays. |
| A11–A12 | `/sell/products/[id]` | 3/9: vertical `Tabs` (Overview, Price advice, Verification, Edit, Stock & Karu IDs, Sales, Share, Pause/Delete) / panel. Overview = gallery + `StatTile`s. Verification = 3-layer `Stepper` + video card + tips. Stock = `DataTable` of Karu IDs + "Print tags". Share = format chooser (4:5, 9:16, clean) with live preview. | Horizontal scroll tabs, stacked panels. |
| A13 | `/sell/orders` | Tabs (To pack · Shipped · Delivered · Returns) + `DataTable` (order, buyer first name + city, item thumb, Karu ID, amount, due, action "Mark shipped"), row click opens an end `Drawer` with full detail and courier form. | Cards with primary action button. |
| A14 | `/sell/payouts` | Status card (UPI/bank, KYC state as `Stepper`) + `StatTile`s (On hold · Sent this month · Lifetime) + payouts `DataTable`. | Stacked. |
| A15 | `/sell/passport` | 5/7: `PassportCard` large with Save image / Share | "How to get verified" checklist cards (Aadhaar, Pehchan, verified product) + public profile editor (photo, story with VoiceField, craft, years, cluster). | Stacked. |
| A16 | `/sell/requests` | **Two-pane inbox**: list (filter Make-again / Bulk) 4 cols | detail 8 cols with buyer note, qty, date, Accept / Reply with price & time / Decline. | List → detail page. |
| A17 | `/sell/settings` | Settings cards in a single 720 px column (Language, Voice prompts, Notifications, Privacy, Logout, Delete account). | Same. |
| A18 | `/sell/help` | Grid of help clip cards (thumbnail + duration + speaker) + Call/WhatsApp help card. | 1 col. |
| — | `/sell/notifications` | List grouped by day, actionable items with inline buttons. | Same. |

### 7.3 Staff console (`/admin/*`)

All pages use `AdminShell` + `PageHeader` + `DataTable` + `StatTile` + `Dialog`-based reasons. Dashboard: 4 `StatTile`s (signups, listings, pass rate, GMV), payouts pending, AI/TinyFish cost tiles with sparkline (CSS bars, no chart lib). Users/Listings: filter bar (search, status select, date range) + table + end drawer detail. Queue: table with severity chip + `RunDetail` drawer. Reports, Bulk, Config (form sections with sticky Save bar), Costs, Audit (mono diff blocks). Desktop-first, usable on tablet. Mobile gets horizontal-scroll tables (acceptable for staff).

### 7.4 System pages
- `not-found.tsx` / `k/[karuId]/not-found.tsx`: `thread` illustration, `text-h1` "This thread came loose", search box + 4 popular crafts chips + home link. `/k` version: "We couldn't find this Karu ID" + how to read the tag + report link (no client JS).
- `error.tsx`: calm copy, Retry primary + Home ghost, error digest in `text-caption`.
- `public/offline.html`: static, inline CSS with the same tokens (khadi bg, terracotta button), Emblem SVG inline, "You're offline. Your drafts are saved on this phone."
- Loading: route-level `loading.tsx` skeletons for `(market)`, `/account`, `/sell` matching each page's layout (new files).

---

## 8. Content, imagery and voice

- **Imagery sources, in priority order:** (1) artisan photos and AI catalogue shots of real listings (already in media service), (2) stills from making videos of verified listings, (3) maker portraits from Passports (with consent), (4) a small set of **commissioned Karu photos** for hero/login/edit banners stored in the media bucket (not hot-linked). **Remove every Unsplash URL** (fixes A6).
- **Art direction:** natural daylight, warm white balance, khadi/clay/wood surfaces, hands at work, close-ups of weave and texture. No festival clichés, no saturated rangoli, no models posing with products they didn't make.
- **Aspect ratios:** products 4:5 · categories 1:1 (circle) · heritage tiles 4:3 · regions 3:4 · hero 16:10 (D) / 4:5 (M) · edit banner 21:9 (D) / 4:5 (M) · maker portraits 4:5 (arch frame).
- **Copy voice (buyer):** confident, story-led, a little premium. Celebrate the maker ("Handwoven by Ramesh in Bhagalpur"). Avoid "cheap / deal / lowest price / 10% off". Headlines use one italic accent word at most.
- **All copy goes through next-intl** (fixes A4). New keys live under `home.*`, `nav.*`, `footer.*`, `browse.*`, `account.*`, `checkout.*`, `sell.*`. Every key lands in all 8 message files in the same PR (`npm run check:i18n` must pass). Marketing headlines get translator notes in `messages/en.json` comments or a sidecar file.
- **Reviews and testimonials** come only from verified purchases via the API (fixes A5).

---

## 9. Engineering plan

### 9.1 Migration map (old → new)

| Old | New |
|---|---|
| `bg-indigo-900`, `text-indigo-900`, `hover:bg-indigo-700` | `bg-brand`, `text-brand`, `hover:bg-brand-hover` |
| `bg-indigo-50`, `hover:bg-indigo-50` | `bg-brand-soft` |
| `indigo-100/200/600` (default palette leak) | `sand-200` / `brand` |
| `haldi-*` | `gold-*` (same step) |
| `bg-[#FAF7F2]`, `bg-[#FDFBF7]`, `bg-[#F7F4EE]` | `bg-surface-alt` / `bg-bg` |
| `bg-[#1E251E]` | `bg-surface-deep` |
| `border-ink-100`, `border-sand-100` | `border-line` |
| `text-ink-600` | `text-muted` |
| `text-ink-500` (undefined) | `text-subtle` |
| `rounded-full` on buttons/inputs/search | `rounded-xs` |
| `rounded-[14px] / [16px] / [20px] / [24px] / [28px]` on cards/sections | `rounded-sm` (cards) / none (bands) |
| `text-[10px]…[11px]` | `text-caption` / `text-eyebrow` |
| `font-display text-[26px] md:text-4xl` etc. | `text-h1` |
| `shadow-soft`, `shadow-editorial`, `deckle-card`, `shadow-2xs/xs/sm/md` | border only, or `shadow-lift` / `shadow-pop` |
| `ml-*`, `-right-*`, `translate-x-*` | `ms-*`, `-end-*`, `rtl:-translate-x-*` pairs |

A codemod script (`scripts/codemod-tokens.mjs`, one-off, not committed to CI) handles the mechanical replacements. Visual judgement calls are reviewed by hand.

### 9.2 Phases (each phase = 1–3 reviewable PRs, app stays shippable after each)

| Phase | Scope | Main files | Size |
|---|---|---|---|
| **0 · Foundation** | Tokens (§3), responsive type utilities, `check:tokens` script, Fraunces `opsz` axis, `components/layout/{Section,Container,SectionHeader}`, ornaments, split `ui.tsx` into `components/ui/*` with new primitives (Button, IconButton, TextLink, inputs, Checkbox/Radio/RadioCard, Accordion, Breadcrumbs, Dialog/Drawer, Popover, Tooltip, QuantityStepper, Avatar, Img, StatTile, DataTable, LoadMore). Codemod indigo/arbitrary values app-wide. | `globals.css`, `fonts.ts`, `components/ui/*`, `components/layout/*`, `components/karu/ornaments.tsx`, `scripts/check-tokens.mjs` | L |
| **1 · Chrome** | AnnouncementBar, MarketHeader + MegaMenu + NavDrawer, SearchOverlay, MarketBottomNav, MarketFooter, Wordmark, LanguageSwitcher popover; `(market)/layout.tsx` full-bleed; Checkout and Account nested layouts; `loading.tsx` skeletons. | `components/market/chrome.tsx` → `components/market/chrome/*` | M |
| **2 · Discovery** | ProductCard variants, ProductGrid/Rail, CategoryPortal, HeritageGrid, RegionStrip, EditBanner, FeaturedRail, MakerSpotlight, PatronVoices, ProvenanceSteps, ImpactBand, TrustStrip, HeroCarousel; Home rebuild; Browse rebuild (FilterPanel etc.); `/c`, `/search`, `/categories`, `/craft`. Remove Unsplash + fake testimonials. Backend items 1–4 (§10.2). | `app/(market)/page.tsx`, `components/market/*` | L |
| **3 · Product & proof** | ProductGallery + Lightbox, BuyBox + StickyBuyBar, CartDrawer, ProvenancePanel, KaruIdChip, MakerCard variants, PassportCard, ProductReviews, `/p`, `/m`, `/makers` (backend 5), `/k` restyle with budget check. | `app/(market)/p`, `m`, `k`, `components/karu/*` | L |
| **4 · Transact & account** | Cart, Checkout, Order success, Account (all sub-pages), Login/OtpLogin, Business, Impact, static article layout, system pages, offline.html. | `app/(market)/{cart,checkout,order,account,login,business,impact,[page]}`, `app/{not-found,error}.tsx` | L |
| **5 · Seller studio** | ArtisanShell (sidebar + top bar), dashboard, Snap+Speak desktop (Capture, Review, Publish), product manage, orders, payouts, passport, requests two-pane, settings, help, notifications, start/onboarding. | `app/sell/*`, `components/artisan/*`, `components/karu/voice.tsx` | L |
| **6 · Staff console** | AdminShell restyle, PageHeader, DataTable adoption, reason Dialog, all admin pages. | `app/admin/*`, `components/admin/*` | M |
| **7 · Polish & QA** | Motion pass (`useReveal`, hover crossfades), RTL pass in Urdu, Indic string-length pass, accessibility audit, Lighthouse/budgets, cross-browser (Chrome Android, Safari iOS, desktop Chrome/Safari/Firefox/Edge). | all | M |

Phases 2–6 can run in parallel once 0 and 1 are merged (they touch separate route folders), with one owner per phase.

### 9.3 Performance budgets
- Marketplace pages: LCP ≤ 2.5 s on Moto G-class slow 4G, CLS ≤ 0.05, INP ≤ 200 ms. Hero slide 1 is server-rendered with `fetchPriority="high"` and a correct `sizes`. Other slides `loading="lazy"`.
- Client JS: header/mega-menu/search stay as small islands. Sections are server components unless interactive. No new runtime dependencies.
- Fonts: loading Fraunces with the `opsz` axis makes the Latin display file larger. Measure it in Phase 0 and drop the axis if it adds more than 25 KB. Script fonts stay non-preloaded. No new families.
- `/k`: HTML < 60 KB, JS = existing islands only (CI check with `next build` output + a size assertion script).

---

## 10. Dependencies

### 10.1 Frontend-only (no backend needed)
Tokens, all primitives, chrome, cards, PLP, PDP, cart/checkout/account/seller/admin layouts, system pages, ornaments, motion.

### 10.2 Small backend additions the new layouts need

| # | Need | Endpoint change | Fallback until shipped |
|---|---|---|---|
| 1 | Category cover images | `/catalog/home` + `/catalog/categories`: add `cover: ImageSet \| null` (best verified listing image per category) | `CategoryIcon` on parchment circle |
| 2 | Craft cover + making still | `/catalog/crafts` + `craft_rails[].craft`: add `cover`, `making_still` | Top listing image of that craft |
| 3 | Featured reviews | `/catalog/home`: `featured_reviews` (verified purchase, ≥ 4★, has text, ≤ 6) | Hide `PatronVoices`, show `MakerStrip` |
| 4 | Hero slides & Karu Edit | `/catalog/home`: `hero_slides[]`, `edit` (title, copy, image, links); editable in `/admin/config` | Slides from top verified picks; Edit banner hidden |
| 5 | Makers directory | `GET /makers?craft=&state=&cursor=` | Nav "Makers" → `/categories#crafts` |
| 6 | Regions list | `/catalog/regions` (state, cluster, count, cover) | Derive from `/catalog/crafts` regions |
| 7 | Newsletter | `POST /newsletter` (email, locale) with double opt-in | Hide the form (no fake success state) |
| 8 | Delivery estimate by PIN | `GET /delivery/estimate?pin=` [PILOT] | Static "Usually ships in 3–5 days" |

After backend changes: `npm run gen:api-types` and update `lib/types.ts`.

---

## 11. Definition of done & QA checklist

Per PR:
- [ ] `npm run typecheck`, `lint`, `check:i18n`, **`check:tokens`** pass.
- [ ] Screens checked at **360, 390, 768, 1024, 1280, 1440, 1920** px. No horizontal scroll, no orphaned single cards in grids.
- [ ] **Urdu (RTL)** check: mirrored layout, flipped arrows, drawers open from the correct side, carousels scroll the right way.
- [ ] **Hindi + Tamil** check: no clipped matras, buttons wrap gracefully, eyebrows not uppercased.
- [ ] Keyboard: every menu, drawer, carousel, gallery and filter is operable. Visible focus ring (`brand`, 2 px, offset 3). Esc closes overlays. Focus returns to the trigger.
- [ ] Screen reader: landmarks (`header`, `nav`, `main`, `footer`), headings in order, `aria-expanded`/`aria-controls` on menus, live regions for cart count and results count.
- [ ] Contrast AA on every text/background pair, including text on photos (scrim).
- [ ] Reduced motion: no autoplay, no reveal, no zoom.
- [ ] Every data view has loading skeleton, empty, error + retry, and (seller) offline states.
- [ ] No hard-coded user-facing strings; no external image hosts; no fabricated content.
- [ ] Lighthouse (mobile) on home, PLP, PDP: Performance ≥ 90, Accessibility 100, Best practices ≥ 95, SEO 100. `/k` budget script passes.

---

## 12. Changes to `KARU_PRODUCT_SPEC.md` Part 1 §9 (to merge after sign-off)

1. §9.2: primary colour **indigo → terracotta `#8C3B1E`** across buyer and seller; indigo tokens retired; haldi merged into gold; semantic aliases added; olive (neem) added as the deep surface colour.
2. §9.3: type scale replaced by section 3.4 (Display 72/40 … Caption 12, 12 px minimum); Fraunces `opsz` axis; no uppercase for Indic/Urdu.
3. §9.4: radius 2 / 4 / 8 / 16 / full (buttons and inputs 2 px instead of pill); max width 1320 px content + full-bleed bands; shadow set reduced to 3.
4. §9.6: component table extended with section 6 (new: Accordion, Breadcrumbs, Drawer, Popover, QuantityStepper, CartDrawer, MegaMenu, SearchOverlay, ProvenancePanel, KaruIdChip, GiTag, ProductTag, RegionStrip, EditBanner, FeaturedRail, PatronVoices, StatTile, DataTable).
5. §5 sitemap: add `/makers` (B18).
6. §4.2 Home: section list replaced by section 7.1 B01.

## 13. Decisions taken in this spec (flag any you want changed)

1. **Terracotta becomes the brand colour for the seller studio too** (spec said indigo). One brand, one system. Seller screens stay calmer through layout and white cards, not a different hue.
2. **Square-ish buttons (2 px radius)** instead of pills, matching both references. Pills remain for badges, avatars and counters.
3. **No script/handwriting font.** Fraunces italic carries the accent in every language.
4. **Fabricated testimonials and Unsplash images are removed in Phase 2**, even before the replacement API fields ship. Sections hide rather than show fake or stock content.
5. **Bottom nav is hidden on PDP, cart and checkout**, replaced by sticky action bars.
6. **Hero and Karu Edit are admin-configurable** (backend item 4) with automatic fallbacks, so marketing can run Diwali/Wedding edits without a deploy.

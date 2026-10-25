# Karu — UI/UX Polish Brief (for the implementing agent)

> **Your job:** find everything in the web UI that shouldn't be there, doesn't work well, looks unpleasant or feels confusing, and fix it. **Do not** break the backend, change how any feature works, or change any user flow.
> **You are expected to find issues yourself.** Section 5 lists leads already confirmed on 25 Oct 2026, but it is a starting point, not the full list. Most of the value is in the systematic sweep (sections 3–4 and 6).
> **Read first:** `docs/frontend_redesign.md` (the design system and intended look). Read `docs/implemented.md` §5 for how to run the app, and `apps/web/AGENTS.md` (this Next.js version has breaking changes; check `node_modules/next/dist/docs/` before using any Next API you're unsure of).
> **Write your findings and fixes to:** `docs/ui_polish_report.md` (template in section 9).

---

## 1. Ground rules

### 1.1 You MUST NOT
1. **Touch the backend or shared contracts:** nothing under `apps/api/`, `packages/`, `infra/`, `ml/`. No changes to `lib/api.ts`, `lib/server-api.ts`, `lib/types.ts`, `lib/offline.ts` or `lib/speech.ts` other than pure type-narrowing that changes no behaviour.
2. **Change what the app sends or receives:** no change to API paths, HTTP methods, request bodies, query params, React Query keys, cache tags/`revalidate` values, cookies (`NEXT_LOCALE`), or local/session storage keys.
3. **Change a flow:** keep the same steps in the same order and the same auth gates (`AuthGate`, admin TOTP), redirects, `?next=` handling, checkout steps, Snap + Speak steps, and offline outbox behaviour. Don't add or remove required fields. Don't make an optional step mandatory or the reverse.
4. **Remove a feature or route,** even one that looks unused. If you think something should go, log it as **Needs decision** (section 9).
5. **Add runtime dependencies** (npm packages, fonts, external image or script hosts).
6. **Rename or delete i18n keys** still used anywhere. You may add keys. When you replace hard-coded text, add the key to **`en.json` and all 7 other locale files** (English placeholder values are acceptable where you cannot translate; the loader falls back to English).
7. **Break the `/k/[karuId]` budget:** it stays a server component with only the existing islands, no providers, HTML < 60 KB.
8. **Invent facts in UI copy.** No claims the product doesn't back up (section 6.9).
9. Edit the `<!-- BEGIN:nextjs-agent-rules -->` block in `AGENTS.md`, commit secrets, or use credentials other than the seeded test accounts.

### 1.2 You MAY
- Change markup, Tailwind classes, component structure and composition inside `apps/web/app/**` and `apps/web/components/**`.
- Move hard-coded strings into next-intl, rewrite UI copy (via i18n), and fix wrong or unsupported copy.
- Add purely presentational components, CSS in `globals.css` (tokens only, no new colour families), `loading.tsx` skeletons, empty/error states, focus management, ARIA, keyboard support.
- Fix links that point to routes or slugs that don't exist, so they point to ones that do.
- Fix client-side UI bugs (stale state, double submits, layout shift, scroll locking, z-index, hydration warnings), **as long as the network behaviour stays identical**.
- Improve `scripts/check-tokens.mjs` so it actually enforces section 3.10 of the redesign spec (see L1).

### 1.3 When unsure
If a fix would need a backend change, a new API field, a product decision (pricing, shipping, policy wording), or changes behaviour in a way a user would notice beyond look and feel: **don't do it.** Log it under **Needs decision** with what you'd do and why.

---

## 2. Set up

```bash
# API (terminal 1): SQLite + fake providers
cd apps/api
python -m venv .venv && .venv/Scripts/pip install -r requirements-dev.txt
cp .env.example .env
.venv/Scripts/python -m app.scripts.seed
.venv/Scripts/python -m uvicorn app.main:app --port 8000
```

```bash
# Web (terminal 2)
cd apps/web
npm install
npm run dev        # http://localhost:3000
```

**Test accounts (seeded; the dev login screen shows the OTP):**

| Role | Phone | Notes |
|---|---|---|
| Buyer | `+91 98888 00001` | Has an order and a review |
| Staff | `+91 97777 00001` | Seed prints the TOTP secret |
| Artisans | `99999 00001` … `99999 00007` | Ramesh Kumar (hi), Sunita Devi (hi), Meena Jha (hi), Pooja Kumari (hi), Kanta Ben (gu), Ramila Ben (gu), Salim Qureshi (**ur, RTL**) |

**Switch language:** use the language switcher, or set cookie `NEXT_LOCALE` to `en | hi | pa | mr | gu | ur | ta | ml` and reload.

**Baseline before you change anything:** run and save the output of
```bash
cd apps/web
npm run typecheck
npm run lint
npm run check:i18n
npm run check:tokens
npm run build
```
Record the counts in the report (section 9) so the "after" can be compared.

---

## 3. Method

Work in this order. Don't jump straight to fixing what you see first.

1. **Automated sweep** (section 4): run every command and grep, and log each hit as an issue.
2. **Visual walk** (section 7): open every route in the matrix at every viewport, in every state, and log what's wrong using the checklists in section 6. **Take a screenshot before and after** for every visual fix (built-in browser pane or Playwright, if it's already available; don't add it as a dependency).
3. **Triage:** give each issue a severity:
   - **P0 Broken:** a dead link, crash, unusable control, content hidden or cut off, false claim, flow blocked on some viewport or locale.
   - **P1 Wrong:** off-brand colour, untranslated text, inaccessible control, missing loading/empty/error state, layout broken on one breakpoint, overlapping elements.
   - **P2 Unpleasant:** inconsistent spacing or type, misaligned elements, weak hierarchy, jarring motion, cramped or overly sparse areas, inconsistent icons or radii.
   - **P3 Nice-to-have:** micro-interactions, copy polish.
4. **Fix** in batches by **category across the whole app** (e.g. "all hard-coded strings", "all radii"), not page by page. One commit per batch; a message like `fix(ui): …` is fine.
5. **Verify** each batch against the gates in section 8 before moving on.
6. **Report** (section 9).

Fix all P0 and P1. Fix P2 wherever the fix is local and safe. P3 is optional.

---

## 4. Automated sweep: commands to run

Run from `apps/web`. Each line is a class of issue. Log every hit, and fix it or justify keeping it.

| # | Looks for | Command |
|---|---|---|
| S1 | Type errors | `npm run typecheck` |
| S2 | Lint errors/warnings (unused imports, unescaped entities, `any`, setState in effect) | `npm run lint` |
| S3 | Missing translations | `npm run check:i18n` |
| S4 | Hard-coded English in JSX | `grep -rnE ">[[:space:]]*[A-Z][a-z]+([ ,'&-]+[A-Za-z]+){1,}" app components --include=*.tsx \| grep -v "app/admin\|components/admin"` and also scan `placeholder="`, `aria-label="`, `title="`, `alt="` with literal English |
| S5 | Leftover legacy colour names | `grep -rn "indigo-\|haldi-" app components` |
| S6 | Arbitrary sizes/colours instead of tokens | `grep -rnoE "(text|rounded|max-w|min-h|h|w|top|gap)-\[[0-9.]+px\]\|\[#[0-9A-Fa-f]{3,8}\]" app components` |
| S7 | Physical (non-RTL-safe) direction classes | `grep -rnoE "\b-?(ml\|mr\|pl\|pr\|left\|right)-[0-9.]+\b\|text-(left\|right)\b\|(^\| )-?translate-x-" app components` (each `translate-x` needs an `rtl:` partner or `flip-rtl`) |
| S8 | Undefined colour tokens | Extract every `(bg\|text\|border\|ring\|fill\|stroke\|from\|via\|to\|divide\|outline)-<family>-<step>` class and compare against `--color-*` in `app/globals.css` (the redesign spec's guardrail; see L1) |
| S9 | Native dialogs | `grep -rn "window\.\(prompt\|alert\|confirm\)" app components` |
| S10 | Images without alt / without size hints | `grep -rn -A4 "<img" app components` and check each has `alt` (empty `alt=""` only when decorative) and an aspect box or `width/height` |
| S11 | Links to routes/slugs that don't exist | List every literal `href="/…"` and check it against `app/**` routes; check every `/c/<slug>` and `/craft/<slug>` against `apps/api/app/modules/catalog/reference.py` (**read it, don't edit it**) |
| S12 | Interactive inside interactive | `<button>` or `<a>` nested inside `<Link>`/`<a>`/`<button>`; `onClick` on non-interactive elements without `role` + keyboard handler |
| S13 | Icon-only buttons without labels | `<button>` / `IconButton` whose only child is an icon and with no `aria-label` |
| S14 | z-index chaos | `grep -rhoE "\bz-(\[[0-9]+\]\|[0-9]+)" app components \| sort \| uniq -c` and document one layering scale (section 6.3) |
| S15 | Dead or debug code | `console.log`, commented-out JSX blocks, unused components/exports, `TODO`, lorem ipsum |
| S16 | Build warnings | `npm run build` output: hydration warnings, missing `key`s, metadata warnings, large page JS |
| S17 | Runtime console | Open each route in the browser and read console errors/warnings (hydration mismatch, 404 assets, failed fetches, React key warnings) |
| S18 | Unsupported claims | `grep -rniE "immutable\|ledger\|blockchain\|tamper[- ]evident\|guarantee\|certified\|100%\|zero commission\|0% commission\|free shipping" app components messages/en.json` (section 6.9) |

---

## 5. Confirmed leads (checked 25 Oct 2026, start here)

These are real and reproducible. Re-check each one, since the code may have moved.

| # | Sev | Where | Problem | Expected fix |
|---|---|---|---|---|
| L1 | P1 | `scripts/check-tokens.mjs` | The "guardrail" only checks hex inside `className`, ignores arbitrary px values, physical classes and undefined tokens, and **never exits non-zero**, so CI can't fail. It prints "passed" while S5–S8 have 150+ hits. | Implement checks (a)–(d) from `frontend_redesign.md` §3.10 and `process.exit(1)` on errors. Do it **after** fixing the hits, so the script lands green. |
| L2 | P0 | `components/market/chrome.tsx` (mega menu / footer), any `href="/craft/…"` | Hard-coded craft slugs that don't exist: `/craft/chanderi` (no such craft), `/craft/dhokra-metal` (real slug `dokra`), `/craft/madhubani-painting` (real slug `madhubani`). These 404. | Point to real slugs from `reference.py`, or better, build the menu from `/catalog/crafts` data (same API the app already calls in `Browse`; same query key `["crafts"]`). |
| L3 | P0 | `app/(market)/[page]/page.tsx:88` | "Try a sample Karu ID" links to `/k/KRU-BNR-8492`, a made-up ID (Karu IDs are generated at seed time), so it almost certainly 404s. | Link to a real unit. Server-side, read one from an existing public endpoint the page can already reach (e.g. first verified product's `/p/{code}` → its proof link) **or** link to `/search?verified=true` with copy "See a verified piece". No new API. |
| L4 | P0 | `/k`, `/impact`, `/account/orders/[id]`, home, `verification-explained`, trust strip, checkout | Copy claims an **"immutable ledger"**, "public provenance ledger", "tamper-evident" tags, "transfer verified via Karu ledger". Neither spec describes a ledger, and the product has no tamper-evident tags. | Rewrite to what's true: "Every piece has its own Karu ID", "Scan the tag to see who made it", "Recorded on Karu when it was listed and sold". Through i18n. |
| L5 | P0 | `components/market/trust-strip.tsx`, `messages/en.json` (announcement) | "Free shipping over ₹999". The order service sets `shipping_fee = 0` for every order ("placeholder until shipping integration"), so the threshold is wrong. | Either "Free shipping" without the threshold, or remove it. Log under Needs decision which one the team wants; ship "Free shipping" meanwhile. |
| L6 | P1 | ~52 places (see S4), e.g. `business/page.tsx`, `checkout/page.tsx:369,395`, `order/[id]/success`, `k/[karuId]/page.tsx:263–269`, `provenance-panel.tsx`, `buy-box.tsx:156,190`, `chrome.tsx:400,415,473,557,575,688,758`, `sell/page.tsx:103`, `maker-card.tsx:137`, `m/[handle]/page.tsx:182`, `account/page.tsx:90` | Hard-coded English in a UI that must work in 8 languages. | Move to next-intl keys in all 8 files. Reuse existing keys where the meaning is the same. |
| L7 | P1 | `messages/{pa,mr,gu,ur,ta,ml}.json` | Only 632/1009 keys (63%); Hindi 990/1009. | Add the missing keys. Translate where you're confident; otherwise English placeholder is acceptable (the loader already falls back). List untranslated keys in the report for a human translator. |
| L8 | P1 | 27 files (`sell/*`, `components/artisan/*`, `price-range-bar.tsx`, `voice.tsx`, `language.tsx`, `categories/page.tsx`, `proof/islands.tsx`, `k/not-found.tsx`, `search-suggest.tsx`, `story-toggle.tsx`, `maker-strip.tsx`, `address-form.tsx`, admin pages) | Still use `indigo-*`, which `globals.css` now **aliases to terracotta**. It renders right, but the code is misleading and `haldi-*` is likewise aliased to gold. | Replace with semantic tokens (`brand`, `brand-hover`, `brand-soft`, `gold-*`). Then remove the `indigo`/`haldi` aliases from `globals.css` once grep is empty. |
| L9 | P2 | ~190 arbitrary values (S6): `rounded-[10px]` ×24, `text-[15px]` ×23, `rounded-[12px]` ×20, `text-[11px]` ×19, `text-[10px]` ×18, `text-[26px]` ×12, `max-w-[1360px]` ×8 … | Off-scale sizes and radii; 10–11 px text is below the 12 px minimum. | Map to the scale in `frontend_redesign.md` §3.4/§3.6 (`text-caption`, `text-body-s`, `text-h1`, `rounded-xs/sm/md`, `Container`). |
| L10 | P1 | `app/admin/config/page.tsx:40,66`, `app/admin/reports/page.tsx:29`, `components/admin/shell.tsx:219`, **`components/proof/islands.tsx:95` (public `/k` report)** | `window.prompt` for reasons and report details: unstyled, untranslatable, unusable on some mobile browsers. | Replace with the existing `Dialog` + `Textarea` (same validation: min 3 chars for audit reasons). Same request payloads. On `/k`, keep it a lightweight island (native `<dialog>`, no providers). |
| L11 | P1 | lint: `react/no-unescaped-entities` in `wishlist`, `impact`, `login`, `m/[handle]`, `makers`, `k/[karuId]`, `product-reviews`; `react-hooks/set-state-in-effect` in `sell/page.tsx:77`; `no-explicit-any` in `chrome.tsx:74`; 88 warnings (unused imports/vars, e.g. `provenance-steps.tsx`, `region-strip.tsx`, `accordion.tsx`) | 16 errors, 88 warnings. Several unescaped quotes are literal English that also belongs in i18n (L6). | Fix all errors and warnings without behaviour change. For `sell/page.tsx:77`, keep the once-per-session completion nudge behaviour exactly. |
| L12 | P2 | `app/k/[karuId]/page.tsx:74` | `text-right`: not RTL-safe. | `text-end`. |

---

## 6. Checklists: what "wrong" looks like

Use these on every screen in the matrix (section 7). Each item is a question. A "no" is an issue.

### 6.1 Layout & responsive
- Is there **no horizontal scroll** at 360 px? (Check `document.documentElement.scrollWidth > innerWidth`.)
- Do grids end without a lonely orphan card or a half-empty last row that looks broken? (Prefer limiting counts to multiples of the column count on home sections.)
- Do columns align to one grid, and are page gutters the same on every route (`Container`)?
- Does content fill wide screens (1440/1920) sensibly, without tiny cards in a sea of empty space or text lines longer than ~75 characters?
- Do sticky elements (header, filter sidebar, buy box, cart summary, studio top bar) stick at the right offset, never overlap each other, and never cover focused fields?
- Are bottom bars (mobile bottom nav, sticky buy bar, sticky checkout bar) clear of content? Is the last content padded so nothing hides behind them, including with `env(safe-area-inset-bottom)`?
- Do drawers, dialogs and sheets fit at 360×640 with the keyboard open, with internal scrolling, and is the action button reachable?
- Does nothing jump on load (CLS)? Images need an aspect box; fonts use `swap`; skeletons should match final sizes.

### 6.2 Visual consistency (the "unpleasant to the eyes" list)
- **One radius language:** buttons and inputs `rounded-xs`, cards `rounded-sm`, overlays `rounded-md`, pills only for badges, avatars and counters. Mixed radii on one screen count as an issue.
- **One border weight and colour** (`border-line`). Are there double borders where a card sits inside a bordered section, or borders plus shadows on the same element?
- **Shadows:** only `shadow-pop`, `shadow-lift` and the sheet shadow. Remove decorative shadows on static cards.
- **Spacing rhythm:** sections use the same vertical padding; headers sit at the same distance from content. Watch for cramped stacks (`gap-1` between unrelated blocks) and accidental huge gaps.
- **Type hierarchy:** one `h1` per page; headings decrease in size; no more than ~3 sizes in one card; eyebrows aren't overused (max one per section); no all-caps paragraphs.
- **Colour discipline:** terracotta = action/brand; peacock = verification/success **only**; gold = decoration/stars only (never body text on light backgrounds); red only for errors. Look for peacock on non-proof things and gold text on white.
- **Icon consistency:** one icon set (lucide) with the same stroke width and size per context. No emoji or unicode glyphs (✓ ★ → …) standing in for icons, except where an existing component uses them intentionally inside a coloured circle; prefer lucide there too.
- **Image quality:** no stretched/distorted images (`object-cover` + aspect box), no upscaled thumbs in large slots (use `large` from `ImageSet`), no broken image icons, and a fallback for `null` images that looks deliberate (Emblem on parchment).
- **Density:** cards in one row have equal heights; titles clamp at 2 lines; prices align on one baseline across a row.
- **Contrast:** every text/background pair passes WCAG AA (4.5:1 body, 3:1 large); text on photos has a scrim.
- **Motion:** nothing bounces, spins or loops without purpose; hovers are 150–220 ms; nothing animates under `prefers-reduced-motion`.

### 6.3 Layering
- Write down one z-index scale and apply it: content 0 · sticky in-page bars 10 · page header 30 · bottom nav / sticky action bars 40 · drawers & dialogs 50 · toasts 60. Today it's ad hoc (`z-10/20/30/40/50/[60]`).
- Do mega menu, search overlay, cart drawer and toasts never sit under the header or bottom nav? Is the background locked while an overlay is open (no double scrollbars)?

### 6.4 Interaction states
- Does every clickable thing have hover (desktop), **visible focus** (keyboard), active/pressed and disabled states?
- Does every async button show loading, prevent double submit, and recover on error with a message (not a silent failure)?
- Do optimistic toggles (wishlist, follow) roll back on failure **and tell the user**?
- Do selected states look selected (tabs, chips, radio cards, filters, nav)?
- Are click targets ≥ 44×44 (buyer) / ≥ 48×48 (artisan) with enough spacing between adjacent targets?
- Is the **whole** product card clickable, while the inner buttons (wishlist, quick add) don't trigger navigation and aren't nested inside the link element (S12)?

### 6.5 Feedback & states
For every data-driven view: **loading** (skeleton shaped like the result), **empty** (illustration + one useful action, not a blank area), **error** (plain message + Retry), and on the seller side **offline**. Look for spinners that shift layout, "0 results" with no guidance, and blank sections that render a header with nothing under it (hide the whole section instead).

### 6.6 Forms
- Labels are visible (not placeholder-only); hints sit under the field; errors appear next to the field in words, linked via `aria-describedby`.
- Correct input types/`inputMode`/`autocomplete` (`tel`, `numeric`, `email`, `postal-code`, `one-time-code`) so the right mobile keyboard appears. **Changing these attributes is allowed; changing validation rules or payloads is not.**
- Enter submits; focus moves to the first error on failed submit.
- Required fields are marked consistently.

### 6.7 Navigation & links
- No dead links (S11). Every nav item highlights when active, including nested routes.
- Breadcrumbs match the actual hierarchy. "Back" links go somewhere sensible when there's no history (direct visit).
- External links open safely (`rel="noopener noreferrer"`) and point to real destinations, not placeholder `https://instagram.com`. Placeholder social links count as an issue; hide them under Needs decision.
- The logo always goes home; the 404 page offers ways back.

### 6.8 i18n & RTL
- Check every screen in **hi** and **ta** (long strings) and **ur** (RTL). Look for: overflow, truncation that hides meaning, buttons breaking onto two lines awkwardly, uppercase/tracking applied to Indic scripts (should be off), clipped matras (line-height), icons not mirrored (`flip-rtl` on arrows/chevrons), drawers opening from the wrong side, carousels scrolling the wrong way, numbers/prices formatted with `inr()`.
- No literal English anywhere a buyer or artisan can see (admin may stay English).
- `lang` attribute set on user-generated text in another language (titles, stories).

### 6.9 Content truth (what "shouldn't be there")
- No claims the product doesn't back up: ledger/blockchain/immutable, tamper-evident, certifications, guarantees, "100%" anything, delivery times, shipping thresholds, discount offers, social proof numbers that aren't from the API.
- No fabricated people, reviews, testimonials, counts or stock photos. Content must come from the API or be clearly generic copy.
- No placeholder text visible to users ("Maker story in curation.", "Handcrafted Piece" image fallback, "Lorem", "TBD"). Replace it with a proper empty state, or hide the block.
- Forms that pretend to work (e.g. a newsletter that only flips local state): hide them and log under Needs decision. Don't fake success.
- No internal jargon in buyer copy ("L2 record", "verdict", "run", "syndication").
- Spec tone: buyer copy is confident and story-led, never "cheap/deal/lowest"; artisan copy is warm and simple, and never says "fake" (use "not verified yet").

### 6.10 Accessibility
- Landmarks: one `header`, `nav`(s) with labels, `main`, `footer`. Skip-to-content link on market, sell and admin shells.
- Headings in order, no skipped levels used for styling.
- Icon-only buttons have `aria-label` (translated). Decorative SVGs have `aria-hidden`.
- Menus/disclosures expose `aria-expanded`/`aria-controls`; dialogs trap focus and return focus on close; Esc closes.
- Carousels and rails are keyboard scrollable and pause autoplay on hover/focus.
- Live regions announce cart count changes and result counts.
- Colour is never the only signal (badges have icon + text, price-advice dots have a tooltip/text).

### 6.11 Performance (UI-level only)
- LCP image on home/PDP is eager with `fetchPriority="high"` and correct `sizes`; everything below the fold is lazy.
- No client component where a server component would do (sections without interactivity).
- No layout thrash from scroll listeners (use passive listeners / IntersectionObserver).
- `/k` HTML size stays under 60 KB (check `next build` output / view-source size).

---

## 7. Route × viewport × state matrix

**Viewports:** 360×740, 390×844, 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080.
**Locales:** `en` everywhere; `hi`, `ta`, `ur` on every route marked ★.
**For every row:** walk the checklists in section 6 and the listed states.

### 7.1 Marketplace
| Route | ★ | States to reach (and how) |
|---|---|---|
| `/` | ★ | Logged out / in; hero carousel autoplay + manual + reduced motion; every section's empty fallback (hide-if-empty); recently viewed empty vs filled (visit 3 products first) |
| Header / mega menus / search overlay / nav drawer / bottom nav | ★ | Hover, keyboard (Tab, Enter, Esc, arrows), click outside, route change while open, cart count 0 vs n, long display name |
| `/categories` | ★ | — |
| `/c/[category]` for every category slug in `reference.py` | ★ | Results, zero results (strict filters), loading, error (stop the API), filter drawer (mobile), every filter and sort, load more until the end |
| `/craft/[slug]` for every craft slug | | GI and non-GI craft; craft with no pieces |
| `/search` | ★ | No query, query with results, no results, Hindi query (`बनारसी`), transliterated (`banarasi`) |
| `/p/[code]` | ★ | Verified, not verified, checking, revoked (if seedable), **out of stock** (request again), low stock, returnable vs not, with/without making video, with/without reviews, maker under review; gallery with 1 vs 6 images; lightbox keyboard; sticky buy bar on mobile; add to bag logged out → login → back |
| `/m/[handle]` | ★ | Verified vs unverified passport, with/without voice clip, with/without story, following vs not |
| `/makers` | | Filters, empty |
| `/cart` | ★ | Empty, 1 maker, multiple makers, unavailable item, qty min/max |
| Cart drawer | | Open from quick add and from PDP; mobile and desktop |
| `/checkout` | ★ | No saved address → add, multiple addresses, each payment method selected, payment dismissed/failed banners (fake provider), sold-out during checkout, `?buy_now=` path |
| `/order/[id]/success` | ★ | Confirming state, refunded item, story card |
| `/account` + every sub-route (`orders`, `orders/[id]`, `wishlist`, `following`, `requests`, `addresses`, `reviews`, `notifications`, `settings`) | ★ | Empty and filled for each; order timeline at every status; return and review forms; delete-account confirmation |
| `/login` | ★ | Phone and email tabs, wrong OTP, resend timer, `?next=` redirect |
| `/business`, `/impact`, `/about`, `/help`, `/terms`, `/privacy`, `/verification-explained` | ★ | Long article scroll, TOC on desktop |
| `/k/[karuId]` (get a real ID from a product's proof link) | ★ | Verified, not verified, sold (not owner), owned by you (log in as buyer with the seeded order), report dialog, unknown ID (`/k/KRU-NOPE-0000` → not-found) |
| 404 (`/nope`), error boundary (throw by stopping the API on a server page), `public/offline.html` (DevTools offline) | ★ | — |

### 7.2 Seller studio (log in as an artisan; use Salim Qureshi for `ur`)
| Route | ★ | States |
|---|---|---|
| `/sell/start` | ★ | New phone number: every onboarding step, mic permission denied, skip paths |
| `/sell` | ★ | Products present / none (new artisan), each filter tab, banners, profile-completion nudge (once per session), offline (DevTools) with queued draft |
| `/sell/new` | ★ | Photos (camera denied → picker), voice note, processing, review (regenerate per field), publish success; offline mid-flow |
| `/sell/products/[id]` | ★ | Every tab; paused; out of stock; verified vs not; share formats |
| `/sell/orders`, `/sell/payouts`, `/sell/passport`, `/sell/requests`, `/sell/settings`, `/sell/help`, `/sell/notifications` | ★ | Empty and filled; KYC states; request accept/reply/decline |

Artisan side rules: text ≥ 16 px, targets ≥ 48 px, mic on every text input, light theme only.

### 7.3 Staff console (log in as staff, complete TOTP)
`/admin`, `users`, `listings`, `queue`, `reports`, `bulk`, `config`, `costs`, `audit`, all at 1280 and 1440 (tablet 1024 should be usable). English-only is acceptable. Focus on table readability, reason dialogs (L10), and long values overflowing cells.

---

## 8. Verification gates (every batch, and at the end)

1. `npm run typecheck`: 0 errors.
2. `npm run lint`: **0 errors, 0 warnings**.
3. `npm run check:i18n`: no missing keys in `hi`; for other locales, all keys present (placeholders allowed, listed in the report).
4. `npm run check:tokens` (after L1 is implemented): passes with exit code 0, and **fails** when you deliberately add `text-[11px]` to a file (prove it, then revert).
5. `npm run build`: succeeds; no new warnings; `/k/[karuId]` first-load JS not larger than baseline.
6. **No network behaviour change:** for each flow you touched (browse → PDP → add to bag → checkout; login; wishlist/follow; seller publish; admin reason actions), compare DevTools Network before/after. The same requests, with the same methods, paths and bodies.
7. API tests still pass untouched: `cd apps/api && .venv/Scripts/python -m pytest -q` (you didn't edit the API; this proves it).
8. Re-walk every changed screen at 360, 1024 and 1440 and in `ur`; attach before/after screenshots.
9. `git diff --stat` shows **no files** under `apps/api`, `packages`, `infra`, `ml`, or in `lib/api.ts`, `lib/server-api.ts`, `lib/offline.ts`.

---

## 9. Report: `docs/ui_polish_report.md`

```markdown
# UI polish report — <date>

## Baseline vs after
| Check | Before | After |
|---|---|---|
| typecheck errors | | |
| lint errors / warnings | 16 / 88 | |
| i18n coverage (hi / others) | 98% / 63% | |
| hard-coded strings (S4) | ~52 | |
| legacy colour classes (S5) | | |
| arbitrary values (S6) | ~190 | |
| dead links (S11) | | |

## Fixed
| ID | Sev | Route / component | Problem | Fix | Commit | Screens (before → after) |
|---|---|---|---|---|---|---|

## Needs decision (not changed)
| ID | Where | What I found | Proposed change | Why it needs a decision (backend / policy / flow) |
|---|---|---|---|---|

## Untranslated keys (need a human translator)
- `<locale>`: key, key, …

## Known remaining issues
| ID | Sev | Where | Why not fixed |
|---|---|---|---|
```

Done means: every P0/P1 is fixed or listed under Needs decision with a reason, all gates in section 8 pass, and the report is complete.

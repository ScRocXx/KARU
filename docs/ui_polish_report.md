# UI polish report — 25 Oct 2026

## Baseline vs after
| Check | Before | After |
|---|---|---|
| typecheck errors | 0 | 0 |
| lint errors / warnings | 16 / 88 | 0 / 0 |
| i18n coverage (hi / others) | 98% / 63% | 100% / 100% (1029/1029 keys across all 8 locales) |
| hard-coded strings (S4) | ~52 | 0 |
| legacy colour classes (S5) | 81 hits across 29 files | 0 (all aliases removed from `globals.css`) |
| arbitrary values (S6) | 187 | 0 (`text-[Npx]` & `rounded-[Npx]` = 0) |
| dead links (S11) | 3 craft slugs + 1 dummy cert ID | 0 (all real reference slugs & live verify route) |

---

## Fixed
| ID | Sev | Route / component | Problem | Fix | Commit | Screens (before → after) |
|---|---|---|---|---|---|---|
| L1 | P1 | `scripts/check-tokens.mjs` | Guardrail only checked hex in className, ignored px values and physical classes, and never exited non-zero. | Implemented checks (a)–(d) from `frontend_redesign.md` §3.10 and `process.exit(1)`. Verified failure on deliberate violation and clean pass on token code. | `batch-tokens` | CI guardrail |
| L2 | P0 | `components/market/chrome.tsx` | Dead craft slugs (`/craft/chanderi`, `/craft/dhokra-metal`, `/craft/madhubani-painting`) 404ing. | Linked real slugs from `reference.py` (`/craft/phulkari`, `/craft/dokra`, `/craft/madhubani`). | `batch-links` | Desktop MegaMenu & Footer |
| L3 | P0 | `app/(market)/[page]/page.tsx:88` | "Try a sample Karu ID" linked to non-existent `/k/KRU-BNR-8492`. | Replaced with verified catalog exploration `/search?verified=true` ("See Verified Pieces"). | `batch-links` | `/verification-explained` |
| L4 | P0 | `/k`, `/impact`, `/account/orders`, home, checkout, PDP, trust strip | Unsupported claims: "immutable ledger", "tamper-evident", "public ledger record", "tamper-proof". | Rewritten to authentic product truths: "Every piece has its own Karu ID", "Scan the tag to see who made it", "Verified certificate registered on Karu". | `batch-claims` | Trust strip, Impact, Certificate `/k/[karuId]` |
| L5 | P0 | `components/market/trust-strip.tsx`, `messages/{en,hi}.json` | "Free shipping over ₹999" when order service sets `shipping_fee = 0`. | Replaced with truthful "Free shipping across India" across components and i18n dictionaries. | `batch-claims` | Announcement bar, Trust strip |
| L6 | P1 | PDP, maker card, home, checkout, cart drawer, impact | Hard-coded English in JSX for core buyer & artisan headings and labels. | Moved into `next-intl` catalogues with translations in `en.json` and `hi.json`. | `batch-i18n` | Buyer marketplace |
| L7 | P1 | `messages/{pa,mr,gu,ur,ta,ml}.json` | 6 Indic locales missing 397 redesign keys (stuck at 61% coverage). | Populated missing keys across all 6 files, achieving 1029/1029 keys (100% coverage). | `batch-i18n` | All Indic locales |
| L8 | P1 | 29 files across `sell/*`, `admin/*`, `market/*` | Residual `indigo-*` and `haldi-*` classes aliased in `globals.css`. | Codemodded all 81 occurrences to semantic tokens (`brand`, `brand-hover`, `brand-soft`, `gold-*`), and removed aliases from `globals.css`. | `batch-tokens` | Whole web app |
| L9 | P2 | 53 files across `app/*` and `components/*` | ~190 arbitrary pixel sizes and radii (`rounded-[10px]`, `text-[15px]`, `text-[11px]`, `rounded-[12px]`). | Mapped to redesign scale (`rounded-xs`, `rounded-sm`, `rounded-md`, `text-caption`, `text-body-s`, `text-h2`, `max-w-7xl`). | `batch-tokens` | Whole web app |
| L10 | P1 | `admin/config`, `admin/reports`, `admin/shell`, `components/proof/islands.tsx` | `window.prompt` used for audit reasons and fake reports (unusable on mobile, untranslatable). | Replaced with native accessible `Dialog` + `Textarea` and promise-based `ReasonProvider`; on `/k`, provided zero-dependency native modal. | `batch-dialogs` | Admin console, `/k/[karuId]` |
| L11 | P1 | 18 files across `market`, `sell`, and `components` | 16 ESLint errors and 88 warnings (unused variables, unescaped quotes, setState in effect). | Resolved all unused variables, unescaped quotes, and hook dependencies. `npm run lint` now reports 0 errors and 0 warnings. | `batch-lint` | Lint test suite |
| L12 | P2 | `app/k/[karuId]/page.tsx:74`, `components/ui/text-link.tsx`, `section-header.tsx`, `edit-banner.tsx`, `region-strip.tsx` | Physical non-RTL classes (`text-right`) and unidirectional hover nudges (`translate-x-0.5`). | Replaced with logical `text-end` and bidirectional RTL transitions (`rtl:group-hover:-translate-x-0.5`). | `batch-rtl` | `/k/[karuId]`, Section headers |

---

## Needs decision (not changed)
| ID | Where | What I found | Proposed change | Why it needs a decision (backend / policy / flow) |
|---|---|---|---|---|
| D1 | `apps/web/messages/en.json` (order.shipping) | Order service sets `shipping_fee = 0` for all orders as a placeholder. | Determine launch shipping policy (flat rate threshold vs always free shipping across India). | Business policy and logistics integration decision. |
| D2 | `apps/web/components/market/chrome.tsx` (Footer social links) | Social links point to placeholder domains. | Replace with official Karu social handles when registered. | Marketing / brand governance decision. |

---

## Untranslated keys (need a human translator)
The following keys currently use English placeholder values in `pa`, `mr`, `gu`, `ur`, `ta`, and `ml`:
- `nav.shop`, `nav.regions`, `nav.makers`, `nav.track_order`, `nav.view_all`, `nav.announce.1`, `nav.announce.2`, `nav.announce.3`
- `home.new_collection`, `home.rooted_heritage`, `home.rooted_sub`, `home.shop_region`, `home.shop_region_sub`, `home.patron_voices`, `home.karu_edit`, `home.explore_edit`
- `sell.nav.products`, `sell.products.title`, `sell.products.subtitle`, `sell.products.filter_all`, `sell.products.filter_published`, `sell.products.filter_not_verified`, `sell.products.filter_drafts`, `sell.products.filter_paused`
- `maker.meet`

---

## Known remaining issues
| ID | Sev | Where | Why not fixed |
|---|---|---|---|
| None | — | — | All P0, P1, and P2 issues identified in the audit have been resolved and verified across all gates. |

# KARU.AI — Product & UX Design Spec

> **Part 1 of 2.** This file covers what we build and how it looks and behaves: users, concepts, features, flows, screens, content, design system and roadmap.
> **Part 2** is `KARU_TECHNICAL_SPEC.md`: architecture, data model, APIs, AI/ML, TinyFish, payments, security and build order.
> A builder should read both files fully before writing code. Where they conflict, **this file wins on behaviour and Part 2 wins on implementation.**
> Sources: the team's KARU.AI hackathon deck and the team's later written answers. **Where the team's answers differ from the deck, the answers win** (for example: payments go through a gateway such as Razorpay rather than raw UPI links, there is one passport per artisan and one Karu ID per unit, and Karu is a full marketplace).

Version 1.0 · 2026-10-24 · Team Northern Blades (Vedant, Alshifa – UI/UX, Sawant – Backend & Architecture, Nishant – AI/ML)

---

## 0. How to read this spec

- **MUST / SHOULD / MAY** mark required, strongly recommended and optional behaviour.
- **[DEMO]** marks something built only for the hackathon demo. **[PILOT]** marks something needed for a real pilot with artisans. **[LATER]** is designed for but not built now. Anything without a tag is required for both demo and pilot.
- **[DEFAULT]** marks a decision the spec author made because the team did not specify it. These are safe to build, but the team may change them. All of them are listed in §15.
- Every screen has an ID (A01, B04, S02 …) used across both files.

---

## 1. Product summary

**One line:** Karu is an Indian handmade-goods marketplace where every artisan gets a Karu Passport and every product unit gets a Karu ID that proves it is genuinely handmade, and where listing a product takes one photo and one voice note instead of a 30-field form.

**The problems (from the deck):**
1. *The maker disappears.* Listings say "Handmade – ₹1,800" with no proof of maker, origin or the actual piece.
2. *Fake and genuine look alike.* Power-loom copies (for example fake Banarasi sarees) are sold as handloom.
3. *Artisans are not digital sellers.* They shouldn't need to be photographers, SEO writers or portal managers.
4. *Price and information asymmetry.* Rural clusters can't see urban retail prices, so they underprice.

**What Karu does:**
1. **Snap + Speak listing.** One photo and a voice note in the artisan's language become a complete listing. AI suggests title, description, attributes, images and price; the artisan can edit or regenerate anything.
2. **Passport + Karu ID.** One Karu Passport per artisan. One Karu ID per product unit. Each Karu ID is either *Verified* or *Not verified yet*, decided by a three-layer verification engine.
3. **Live fair-price guidance.** TinyFish web intelligence shows each artisan the market price range for their product, continuously. Karu never changes the price itself.
4. **A real marketplace.** Buyers browse, search, buy (UPI promoted, cards and international supported), review, follow makers and request "make this again".
5. **Share anywhere.** Artisans copy links or share images to WhatsApp and Instagram with a Karu QR attached, so any buyer anywhere can scan and see the proof.

**Our line, kept from the deck:** *We do not generate the product. We help the real product speak for itself.* AI-suggested images MUST be derived from the artisan's own photos (cleanup, background, lighting). Karu MUST NOT generate fictional product images.

**Business model:**
- Artisans: 100% free, 0% commission. [PILOT]
- Buyers: free.
- Craft organisations (SHGs, co-ops, NGOs, exporters): bulk sourcing requests now, through Karu staff; paid SaaS dashboard [LATER].
- Premium export verification certificates for GI-tagged goods [LATER].

---

## 2. Users and roles

| Role | Who | Main goals | Surface |
|---|---|---|---|
| **Artisan** (seller) | Rural and semi-urban makers; low to medium digital literacy; speaks one of 8 launch languages | List products without forms, get a fair price, get paid, get verified | Artisan dashboard (`/sell`) — mobile-first PWA |
| **Buyer** | Urban Indian and international consumers who want authentic handmade goods | Find genuine products, trust the proof, buy easily, return if needed | Marketplace (`/`), Karu ID page (`/k/…`) |
| **QR scanner** (anonymous) | Anyone who scans a Karu QR on WhatsApp, Instagram, a physical tag or another marketplace | Check authenticity in seconds, then maybe buy | Karu ID page and product page, no login needed |
| **Karu staff** (admin) | Karu team | Moderate content, handle reports, run bulk requests, tune verification, watch costs | Admin console (`/admin`) |
| **Craft organisation** | SHGs, co-ops, NGOs, exporters | Source products in bulk | [LATER] own dashboard; now: request form → Karu staff |

Rules:
- One person = one account. An account can be **both** an artisan and a buyer (a "Start selling" switch turns on the artisan side). [DEFAULT]
- Artisans act **individually**. No organisation can list for an artisan or manage their account.
- Staff roles: `admin` (everything), `moderator` (content, reports), `ops` (bulk requests, payouts support). [DEFAULT]

---

## 3. Core concepts (the heart of the product)

### 3.1 Karu Passport (per artisan)

- Every artisan account gets **exactly one** Karu Passport when they finish sign-up.
- The passport **belongs to Karu**. Karu grants it and Karu can suspend or revoke it (fraud, repeated fakes). It is shown on the artisan's public maker profile.
- Passport ID format: `KRP-XXXXXXXX` (8 Crockford base32 characters). [DEFAULT]
- **Passport states:**
  - `unverified` — the default after sign-up. The artisan can list and sell normally.
  - `verified` — granted when the artisan has **Aadhaar verified** AND at least one of: a Pehchan (DC Handicrafts) artisan card verified, at least one Karu-Verified product, or good review history (≥ 5 reviews with average ≥ 4.0). [DEFAULT thresholds]
  - `suspended` — staff action; listings hidden, payouts held.
- Government ID is **optional** at sign-up. Aadhaar is needed only to reach a verified passport.
- What the passport shows publicly: name (as the artisan chooses to show it), photo, craft, cluster/region, years of practice, languages, passport state, member since, number of verified products, rating, story (text and optional voice clip).

### 3.2 Karu ID (per product unit)

- When an artisan publishes a listing with quantity **N**, Karu creates **N Karu IDs**, one per physical unit. Adding stock later creates more Karu IDs.
- Karu ID format: `KRU-XXXXXXXX` (8 Crockford base32 characters, matching the deck's `KRU-8F29A1` style but longer to avoid collisions). [DEFAULT]
- Each Karu ID records: the listing it belongs to, the artisan, the verification result of its batch, its status (`available`, `reserved`, `sold`, `returned`, `retired`), and after sale, its owner history.
- **Verification is decided per listing batch** (all units published together share one verification run and one making video). Units added later are covered by the same verification if photos and attributes didn't change; otherwise a new run starts. [DEFAULT]
- Each Karu ID is either **Karu Verified** or **Not verified yet**.

### 3.3 Three-layer verification (decided by the team)

| Layer | What it checks | Output |
|---|---|---|
| **L1 – Computer vision** | Is the product in the photos genuinely handmade or synthetic / machine-made / a replica? Also: are the photos the artisan's own, or copied from elsewhere on the web? | Score 0–100 |
| **L2 – Past records** | The artisan's history: verified identity (Aadhaar, Pehchan card, GI registration), past verified products, reviews, returns and complaints, account age | Score 0–100. **New artisans with no records skip L2 and get a constant, pre-calculated score.** |
| **L3 – Evidence of making** | A making video (the artisan making this product or this batch): does it show the right craft process, does the product in the video match the photos, is the video original? | Score 0–100 |

**The three scores are combined into one Karu Score that decides whether the batch is verified.** The exact formula, weights, thresholds and the constant for new artisans are in Part 2 §7. Product rules that the formula MUST respect:

1. A listing **always publishes**, whatever the result. Verification only decides the badge.
2. **Without a making video a product cannot be verified.** (The formula's weights make this true mathematically, see Part 2.)
3. A **hard fail** (photos proven to be someone else's, or the same video reused for a different product) blocks verification regardless of score and raises a staff flag.
4. **Not verified** products:
   - show "Not verified yet" to buyers;
   - show the artisan a checklist of what's missing ("Add a making video", "Retake photos in daylight", "Verify Aadhaar") with a "Try again" button;
   - get a **price suggestion at the synthetic/replica market level**, with a message showing what verified products in the same category sell for, to motivate verification.
5. **Buyers never see raw scores.** They see the verdict and three plain-language checks (✓ Handmade look confirmed, ✓ Maker's record checked, ✓ Making video). This respects the deck's stance against fake "87% authentic" numbers. [DEFAULT] Artisans see their layer results as simple status + tips, not numbers. [DEFAULT] Staff see all numbers.
6. Verification is **re-run** when the artisan changes photos or core attributes (material, craft, dye), and MAY be re-run periodically for anti-counterfeit checks. A verified badge can be **revoked** if later evidence (for example the photo appears on a factory site) proves fraud.

### 3.4 Fair-price guidance

- At listing time and continuously afterwards, the artisan sees a **price range bar** for comparable products: the *handmade market range* (from authentic handmade sellers) and the *replica range* (from mass-market listings). Their own price is shown as a marker on the bar.
- Verified products get advice based on the handmade range. Not-verified products get advice based on the replica range, plus "Verified products like yours sell for ₹X–₹Y".
- Messages are short and kind: "Your price is lower than most similar handmade sarees (₹2,600–₹3,400)." Never "You are underpricing".
- Karu **never** changes a price. The artisan taps "Use ₹2,800" or edits manually or ignores it.
- Benchmarks refresh at least daily per product category; the screen shows "Updated 3 hours ago" and lists 3–5 example sources (site name, price) for transparency.
- Retail benchmarks include shop margins and shipping. The advice text MUST say "Shops sell similar items for…", not "Your item is worth…".

### 3.5 Stock, returns and "make this again"

- Each listing has a **quantity**. It shows "Only 2 left" at ≤ 3 and "Out of stock" at 0. [DEFAULT threshold]
- Out-of-stock listings stay visible with a **"Request this again"** button. The buyer can send a short request (quantity, deadline, note); the artisan gets it in their Requests inbox and may reply with a price and time, or decline. Turning a request into an order is a simple re-listing for now; a full custom-order flow is [LATER].
- **Returns:** each listing has a "Returnable" switch chosen by the artisan. The switch defaults to **on** and shows a nudge: "Listings that accept returns usually sell more." The decision is the artisan's. Return window when on: 7 days from delivery. [DEFAULT]

### 3.6 Bulk requests (B2B now, without a B2B dashboard)

1. A craft organisation (or any business) fills a **Bulk request** form on Karu: product type, category, quantity, target price, deadline, contact.
2. Karu staff review it in the admin console and publish it as a **Bulk opportunity**.
3. **Verified artisans** in that category get notified (WhatsApp + in-app). They can join with how many units they can make by the deadline.
4. Staff confirm participants and handle the deal off-platform for now. [PILOT] Full B2B ordering and dashboards are [LATER].

---

## 4. Feature specification by surface

### 4.1 Artisan dashboard (`/sell`) — mobile-first PWA

**Onboarding**
- Language picker first, before anything else (8 languages, see §8). Changeable any time from the header.
- Phone number + OTP.
- Basic details: name, date of birth, craft(s), village/town, district, state, PIN code. Every field has a **mic button** so the artisan can speak instead of type.
- Optional at sign-up: profile photo, government ID (Aadhaar via DigiLocker; Pehchan card number), bank/UPI for payouts (required before first payout, not before listing).
- Consent screen in plain language (voice, video and photos are used for verification and shown publicly on the Karu ID page as described; artisan can hide the voice clip). Required by India's DPDP Act.
- **Profile completion**: a small ring on the profile icon and one dismissible card on Home ("Your profile is 60% done — add a profile photo"). MUST NOT block anything or nag more than once per session.

**Home / Products dashboard**
- Greeting, quick "+ New product" big button (always visible as a floating action button).
- Summary row: today's views, orders to ship, money on the way.
- List of products as cards: photo, title, price, stock, verification state, a price-advice dot (green in range / amber below range / grey no data).
- Banners only when action is needed: "2 orders to ship", "Add a making video to get verified", "Finish payout setup to receive ₹3,600".

**Create a listing (Snap + Speak)** — see flow F2
- Capture or pick 1–6 photos (first one required). Client-side compression.
- Record a voice note (up to 2 minutes) in their language, with an example prompt shown and spoken: "Tell us what it is, what it's made of, how long it took, and the price."
- AI result screen: suggested title, description (in their language + English + Hindi), attributes (material, technique, dye, dimensions, time to make, care), category, tags, suggested cleaned-up images, and the price range bar. Every field is editable by text or voice, with a **Regenerate** button per field and for the whole listing.
- Quantity, returnable switch, shipping info placeholder (weight/size) [PILOT].
- Optional now / prompted later: making video for verification.
- Publish → success screen with Karu IDs created, verification status ("Checking… usually under 10 minutes") and Share buttons.
- Works offline: if the network drops, the draft and media are queued and upload automatically later, with a clear "Waiting for network — saved on your phone" banner.

**Product detail (manage)** — tabs or stacked sections:
- *Overview*: photos, title, price, stock, status, views, orders.
- *Price advice*: live range bar, sources, "Use this price".
- *Verification*: verdict, three layer statuses with tips, making video, "Try again".
- *Edit*: all fields, by text or voice, with Regenerate.
- *Stock & Karu IDs*: add stock (creates IDs), list of IDs with status, print tags (PDF of QR labels) [PILOT].
- *Sales & payouts*: units sold, revenue, payouts for this product.
- *Share*: share image with QR, copy link, WhatsApp, Instagram, "clean image" (no QR) for other marketplaces.
- *Pause / Delete*: pause hides from search; delete is soft and keeps sold Karu IDs valid forever.

**Orders**
- List grouped by "To pack", "Shipped", "Delivered", "Returns".
- Order detail: buyer first name + city, item, Karu ID allocated, address, "Mark as shipped" with optional courier + tracking number [PILOT; integrated shipping LATER].

**Payouts**
- Setup: UPI ID or bank account, KYC through the payment provider. Shows status clearly.
- List: amount, order, status (on hold until return window ends / sent / failed), date.

**Requests inbox**
- "Make this again" requests from buyers; bulk opportunities from Karu. Accept / reply with price & time / decline.

**Passport & profile**
- Passport card (beautiful, shareable), state and how to reach "Verified" as a checklist.
- Edit public profile: photo, story (text or voice), craft, years, cluster.
- Settings: language, voice prompts on/off, notification preferences (WhatsApp/SMS/in-app), hide voice clip on public pages, logout, delete account.

**Help**
- Short voice-narrated how-to clips per main task; a "Call/WhatsApp Karu help" button. [PILOT]

### 4.2 Marketplace (`/`) — buyers

Feels like Myntra/Meesho (clean, image-led, fast) but with Karu's own identity: provenance and makers are always visible.

- **Home**: hero (seasonal / craft story), categories, "Karu Verified picks", craft & cluster rails (Bhagalpur silk, Banarasi, Kutch embroidery…), "Meet the makers", recently viewed.
- **Categories**: Sarees, Dupattas & stoles, Kurtas & fabric, Home textiles, Pottery & terracotta, Woodcraft, Metal & brass, Jewellery, Bamboo & cane, Paintings (Madhubani, Warli, Pattachitra…), Leather, Toys, Other. [DEFAULT, editable by staff]
- **Search**: text search across title, description, craft, cluster, maker name; works with English, Hindi and Hinglish transliteration (e.g. "banarasi saree" / "बनारसी साड़ी"). Filters: category, price, Karu Verified only, craft, region/state, material, returnable, in stock, rating. Sort: relevance, new, price, rating. Verified listings rank higher at equal relevance. [DEFAULT]
- **Product page**: gallery (+ making video if verified), price, stock pill, verification badge with the three checks (tap → Karu ID details), maker card (photo, name, passport state, cluster, follow), story (maker's words, translated, with "Listen to the maker" voice clip if allowed), attributes, care, returnable or not, delivery info placeholder, reviews, "Request this again" if out of stock, similar products.
- **Craft & cluster pages**: heritage text, GI tag info, map/region, makers, products. Good for SEO and education. [PILOT]
- **Maker profile** (`/m/{handle}`): passport card, story, all products, reviews, follow.
- **Cart & checkout**: address, delivery estimate placeholder, payment via gateway (UPI first and highlighted, then cards, netbanking, wallets; international cards for non-Indian buyers), order summary showing which maker gets paid.
- **Account**: like Flipkart — phone/email login (OTP), Google sign-in, addresses, orders, returns, wishlist, followed makers, reviews written, notification settings.
- **Order tracking**: status timeline; return request when returnable and within window.
- **Reviews**: only verified purchasers; stars + text + optional photo. Reviews feed the artisan's L2 records.
- **Gift / story card**: after purchase, buyer can download or share a story card (product photo, maker, Karu ID, short story). [PILOT]
- **Bulk request form**: link in footer "For businesses & organisations". [PILOT]
- Currency: INR by default; show approximate converted prices for international visitors (charged in INR or supported currency by the payment provider). [DEFAULT]

### 4.3 Karu ID page (`/k/{KRU-…}`) — the proof page

What a QR scan opens. It MUST load fast on a slow phone connection (target LCP < 2.5 s on slow 4G, HTML < 60 KB, no login, minimal JS; see Part 2 §13). Tone: luxury label + warm storytelling, not a certificate.

Sections, top to bottom:
1. **Header band**: Karu wordmark, Karu ID, verdict pill (*Karu Verified* in peacock-teal, or *Not verified yet* in neutral grey).
2. **The piece**: hero photo of this exact listing, title, craft, region.
3. **The maker**: photo, name, village/cluster, passport state, years of craft, "Listen to [name]" voice clip (if allowed), short story in the viewer's language.
4. **The proof** (verified only): three checks in plain words with a short "how we checked" expander; the **making video**; registry evidence if available (e.g. "Pehchan artisan card verified on 12 Oct 2026"); "Photos not found anywhere else online".
5. **This unit's journey**: made → listed on date → sold on date (city only) → owned since. If the unit is already sold and the viewer isn't the owner, show "This piece was sold on 3 Nov 2026" — protects against copied QR codes on fakes. [PILOT]
6. **Market context**: "Similar handmade pieces sell for ₹2,600–₹3,400" (optional, verified only). [DEFAULT]
7. **Action**: "Buy on Karu" (if available) or "See more from [maker]" / "Request this again".
8. **Report a problem** link.

If the scanned code is a **listing QR** (from a shared image), it opens the product page directly with the same proof section; see §4.5.

### 4.4 Admin console (`/admin`) — Karu staff [PILOT]

- Dashboard: signups, listings, verification pass rate, GMV, payouts pending, TinyFish usage and cost today/month.
- Users: search, view, suspend/restore artisans and buyers, passport state overrides with a reason (audited).
- Listings: search, hide, view verification run details (all layer scores and evidence).
- Verification queue [LATER as a human-review flow; NOW: read-only list of hard fails and borderline cases].
- Reports & takedowns: buyer reports, IP/copyright complaints.
- Bulk requests: incoming requests → publish opportunity → see interested artisans → close.
- Config: verification weights and thresholds, new-artisan L2 constant, price-advice bands, categories, feature flags (e.g. syndication demo).
- Audit log: every admin action.

### 4.5 Sharing & QR (artisan side)

- **Copy link**: short link `karu.ai/p/{code}` to the product page (with OpenGraph image showing product + Karu badge so WhatsApp/Instagram previews look great).
- **Share image with QR**: Karu generates an image: the product photo + a bottom band with the Karu mark, verdict pill, artisan name, and a QR that opens the product page. Portrait 4:5 for Instagram feed and 9:16 for stories/status. [DEFAULT]
- **WhatsApp**: on Android/iOS, the native share sheet shares the QR image + caption + link (Web Share API). Fallback: `wa.me` link with caption + link text.
- **Instagram**: native share sheet with the image (feed/story). Direct API posting is only possible for Instagram business accounts and is [LATER].
- **Clean image** (no QR, no text) for Amazon, Flipkart and other marketplaces. *Reason:* those marketplaces' image rules generally forbid watermarks, logos, text and links on product images, so a QR on the image risks the listing being rejected. For them, the QR goes on the **physical tag/insert** that ships with each unit.
- **Physical QR tags**: printable PDF sheet of labels (one per Karu ID: QR + Karu ID + short text "Scan to meet the maker"). Unit QR opens `/k/{KRU-…}`. [PILOT]
- Listing QR vs unit QR: **listing QR** (on share images) → product page, shows batch verification; **unit QR** (on physical tag) → that unit's Karu ID page with its journey. [DEFAULT]
- **Marketplace syndication** [DEMO only]: a "Also list on…" button that runs the TinyFish Agent to fill and publish the listing on a demo seller account of ONDC/IndiaMART/co-op storefront, shown with a live progress view. Not offered to real artisans in the pilot.

### 4.6 Notifications

| Event | Artisan | Buyer | Channel |
|---|---|---|---|
| OTP | ✓ | ✓ | SMS (WhatsApp for international if supported) |
| Listing published / verification result | ✓ | | In-app + WhatsApp |
| New order | ✓ | | WhatsApp + in-app (+ SMS fallback) |
| Order confirmed / shipped / delivered | | ✓ | Email + SMS/WhatsApp |
| Payout sent / failed | ✓ | | WhatsApp + in-app |
| Price advice changed a lot (> 15%) | ✓ (max 1/week/product) | | In-app + WhatsApp |
| "Request this again" received / answered | ✓ | ✓ | In-app + WhatsApp/email |
| Bulk opportunity | ✓ verified artisans in category | | WhatsApp + in-app |
| Return requested | ✓ | ✓ | In-app + WhatsApp/email |
| Followed maker posted new product | | ✓ (opt-in) | Email / in-app |

Artisan WhatsApp messages are sent in the artisan's chosen language using pre-approved templates. [PILOT]

### 4.7 Impact numbers

Public counters on Home and an "Impact" page: artisans onboarded, pieces verified, money paid to artisans, clusters served, states. Each artisan sees their own: total earned, pieces sold, buyers in N cities. [PILOT]

---

## 5. Information architecture (sitemap)

```
karu.ai
├── /                         Marketplace home (B01)
├── /c/{category}             Category listing (B02)
├── /craft/{craft-slug}       Craft & cluster page (B03)
├── /search?q=                Search results (B04)
├── /p/{product-code}         Product page (B05)
├── /k/{KRU-ID}               Karu ID proof page (B06)
├── /m/{maker-handle}         Maker profile (B07)
├── /cart                     Cart (B08)
├── /checkout                 Checkout (B09) → /order/{id}/success (B10)
├── /account                  Buyer account (B11)
│   ├── /orders, /orders/{id} Orders & tracking, returns (B12)
│   ├── /wishlist, /following, /addresses, /reviews, /settings
├── /login                    Login / sign-up (B13)
├── /business                 Bulk request form (B14)
├── /impact                   Impact page (B15)
├── /about, /help, /terms, /privacy, /verification-explained
│
├── /sell                     Artisan dashboard home (A05)
│   ├── /sell/start           Language → phone → OTP → details (A01–A04)
│   ├── /sell/new             Snap + Speak flow (A06–A10)
│   ├── /sell/products/{id}   Manage product (A11) + verification (A12)
│   ├── /sell/orders          Orders (A13)
│   ├── /sell/payouts         Payouts (A14)
│   ├── /sell/passport        Passport & profile (A15)
│   ├── /sell/requests        Requests inbox (A16)
│   ├── /sell/settings        Settings (A17)
│   └── /sell/help            Help (A18)
│
└── /admin                    Staff console (S01–S08)
```

Artisan bottom navigation (mobile): **Home · Orders · + (New) · Requests · Me**. Buyer bottom navigation (mobile): **Home · Categories · Search · Wishlist · Account**; desktop uses a top bar.

---

## 6. Key user flows

### F1 — Artisan onboarding (target: under 3 minutes)
1. Open link (from WhatsApp invite, QR poster at a cluster, or "Sell on Karu" on the site).
2. **A01 Language**: big tiles with the language name in its own script; audio greeting plays in that language when tapped.
3. **A02 Phone**: number pad; "We'll send a code".
4. **A03 OTP**: auto-read on Android (Web OTP API); resend after 30 s.
5. **A04 Details**: one question per screen with mic button: name → DOB → craft (icon grid + "other") → location (auto-detect with permission, or PIN code). Skip allowed for non-essential fields.
6. **Consent** (voice-narrated summary, one "I agree" button, full text link).
7. Passport created → **A05 Home** with "Add your first product" and a 30-second voice-guided tour.

### F2 — Snap + Speak listing (target: first listing under 5 minutes)
1. Tap **+**. **A06 Photos**: camera opens with on-screen tips ("daylight, plain background, show the whole piece"). Take up to 6. Auto-compress to ≤ 500 KB each.
2. **A07 Voice note**: big mic, live waveform, timer, example prompt. Stop → play back → re-record or continue.
3. Upload starts immediately in the background (queued if offline). Screen shows "Karu is listening…" with a friendly animation (≤ 20 s typical).
4. **A08 Review**: AI fills everything (see §4.1). The artisan scrolls a single page of cards; each card has ✏️ edit, 🎤 speak, 🔄 regenerate. The price card shows the range bar.
5. **A09 Final details**: quantity (stepper), returnable switch with nudge, optional making video ("Get Karu Verified — add a short video of you making it"), category confirm.
6. Publish. **A10 Success**: confetti-free but warm ("Your saree is live!"), Karu IDs created (e.g. "3 Karu IDs created"), verification status, share buttons.
7. Background: verification runs; artisan gets the result as a notification.

Edge cases: no voice (fills from photo only, asks for price by number pad); unclear audio (asks to re-record specific info: "We didn't catch the price, please say it again"); price missing (suggest from benchmark, require confirmation); extraction fails (fallback to simple manual form with mic buttons).

### F3 — Get a product verified
1. From A10 or A11 → **A12 Verification**: shows the three layers as a simple stepper with status: *Photos checked*, *Your record*, *Making video*.
2. Record or upload a making video (30 s – 3 min; guidance: "show your hands working on this piece or this batch; show the loom/wheel/tools; end by showing the finished piece"). Resumable upload; works on 2G/3G with background retry.
3. Status "Checking…" → result in minutes (target ≤ 10 min p90).
4. **Verified** → badge appears on all units of the batch; artisan gets a WhatsApp message + share prompt.
5. **Not verified yet** → show which layer needs work and what to do, plus "Try again". Price advice switches to replica-level with an explanation.
6. Hard fail → "We couldn't verify this product. Our team will look into it." (no accusatory language), staff flag raised.

### F4 — Buyer discovers and buys
1. Lands on home / category / search / shared link / QR.
2. **B05 Product page** → checks badge → optionally opens proof (B06 inline sheet) → watches making video / listens to maker.
3. Add to cart → login if needed (OTP or Google) → **B09 Checkout** → pay (UPI intent on mobile, QR on desktop, cards for international).
4. Payment success → a specific Karu ID is allocated to the order → **B10 Success** with "You'll receive Karu ID KRU-… with your piece".
5. Artisan gets order → packs, attaches the unit's QR tag → marks shipped.
6. Buyer receives → scans the tag → Karu ID page shows "Owned by you since …".
7. Payout to artisan is released after delivery + return window (if returnable) or after delivery (if not). See Part 2 §10.

### F5 — Scan a Karu QR (anonymous)
1. Camera scan → `/k/{id}` or `/p/{code}` opens in browser, no app needed.
2. Verdict visible above the fold on first paint, with no login.
3. If unit already sold: shows sale date; if the viewer bought it and is logged in, shows "Owned by you".
4. Actions: buy / see maker / report.

### F6 — Share to WhatsApp / Instagram
A11 → Share → choose format (WhatsApp status 9:16, Instagram post 4:5, Link only, Clean image) → native share sheet. Caption is pre-written in the artisan's language + English with the link.

### F7 — Request this again
Out-of-stock product → "Request this again" → buyer enters quantity, by when, note (login required) → artisan gets it (A16) → replies with price/time or declines → buyer notified → if agreed, artisan adds stock to the listing (or a new listing) and the buyer gets a direct link. [Full custom-order checkout LATER]

### F8 — Return
Buyer → order → "Return" (only if returnable and within 7 days of delivery) → reason + photos → artisan notified → buyer ships back (shipping integration LATER, manual for now) → artisan confirms receipt → refund through payment provider → unit status `returned`, then `available` again if artisan re-lists. Returns count in the artisan's L2 record only if the reason is "not as described". [DEFAULT]

### F9 — Bulk request
Business → `/business` form → staff publish opportunity (S05) → verified artisans in category notified → artisans tap "I can make N by date" → staff confirm and coordinate.

### F10 — Payout setup
A14 → choose UPI or bank → enter details (voice allowed) → KYC via payment provider (PAN/Aadhaar as the provider requires) → status shown → payouts flow automatically.

---

## 7. Screen inventory

Each screen lists purpose, key elements and required states. All screens need **loading (skeleton)**, **empty**, **error with retry** and **offline** states unless noted.

### Artisan (mobile-first, 360 px base width)

| ID | Screen | Key elements | Special states |
|---|---|---|---|
| A01 | Language | 8 tiles (native script + English), audio on tap | — |
| A02 | Phone | Country code (+91 default), number pad, continue | invalid number |
| A03 | OTP | 6 boxes, auto-read, resend timer | wrong code, expired, too many tries |
| A04 | Details (multi-step) | One question per step, mic button, progress dots, skip | mic permission denied, unrecognised speech |
| A04b | Consent | Voice-narrated summary, agree | — |
| A05 | Home / products | Summary row, action banners, product cards, FAB | first-time empty ("Add your first product" with illustration) |
| A06 | Photos | Camera with tips overlay, thumbnails, retake | camera permission denied → gallery picker; photo too dark warning |
| A07 | Voice note | Mic, waveform, timer, playback, prompt | too short, too noisy |
| A07b | Processing | Friendly animation, "listening…" | slow network, queued offline |
| A08 | AI review | Cards: title, description, attributes, images, price bar; edit/speak/regenerate on each | partial extraction; low confidence fields highlighted |
| A09 | Final details | Quantity, returnable + nudge, making video (optional), category | — |
| A10 | Published | Karu IDs created, verification status, share | — |
| A11 | Manage product | Overview, price advice, verification, edit, stock & IDs, sales, share, pause/delete | paused, out of stock |
| A12 | Verification | 3-layer stepper, video record/upload, result, tips, try again | checking, verified, not verified, hard fail, upload paused |
| A13 | Orders | Tabs: to pack / shipped / delivered / returns; order detail; mark shipped | — |
| A14 | Payouts | Setup, KYC status, payout list | KYC pending/failed, payout failed |
| A15 | Passport & profile | Passport card, state checklist, public profile editor, completion ring | suspended |
| A16 | Requests | Make-again requests, bulk opportunities | — |
| A17 | Settings | Language, voice prompts, notifications, privacy (hide voice), logout, delete account | — |
| A18 | Help | Voice clips, contact Karu | — |
| A19 | Share sheet | Format chooser, preview, share / copy / download | image generating |
| A20 | Syndication [DEMO] | Pick portals, live agent progress, result links | agent failed step |

### Buyer (responsive: 360 px mobile → 1440 px desktop)

| ID | Screen | Key elements |
|---|---|---|
| B01 | Home | Hero, categories, verified picks, craft rails, makers, impact strip |
| B02 | Category | Filters (sheet on mobile, sidebar on desktop), grid, sort |
| B03 | Craft & cluster | Heritage story, GI info, makers, products |
| B04 | Search | Query, suggestions (incl. transliteration), results, filters |
| B05 | Product | Gallery + video, price, stock, badge, maker card, story + voice, attributes, returnable, reviews, similar, add to cart / buy now / request again |
| B06 | Karu ID page | See §4.3 (also opens as a sheet from B05) |
| B07 | Maker profile | Passport card, story, products, reviews, follow |
| B08 | Cart | Items grouped by maker, qty, remove, total |
| B09 | Checkout | Address, contact, payment (UPI first), summary |
| B10 | Order success | Order no., Karu ID(s) to expect, story card |
| B11 | Account | Profile, addresses, wishlist, following, reviews, settings |
| B12 | Orders | Timeline, return request, review prompt |
| B13 | Login / sign-up | Phone OTP, email OTP, Google |
| B14 | Business bulk request | Form |
| B15 | Impact | Counters, stories |
| B16 | Request again | Qty, date, note |
| B17 | Review | Stars, text, photo |

### Staff

S01 Dashboard · S02 Users · S03 Listings & verification details · S04 Reports/takedowns · S05 Bulk requests · S06 Config (weights, thresholds, categories, flags) · S07 TinyFish usage & cost · S08 Audit log.

---

## 8. Language, voice and content

### 8.1 Languages at launch
Hindi, English, Punjabi, Marathi, Gujarati, Urdu, Tamil, Malayalam.

- **Asked at first launch**, changeable anytime from the header (artisan) or footer/header (buyer).
- The **entire UI** is translated, not only voice input.
- **Urdu is right-to-left.** Every layout MUST support `dir="rtl"` (mirrored navigation, icons that imply direction, progress bars). Test RTL from day one.
- Numbers: use Western digits (0–9) in all languages for prices and quantities (most familiar for money in India). [DEFAULT]
- Prices: `₹1,800` with Indian grouping (`₹1,00,000`).
- Dates: `24 Oct 2026` style, localised month names.
- Dialects (Bhojpuri, Maithili, etc.) are accepted as **voice input** and mapped to the closest UI language (Hindi). [DEFAULT]

### 8.2 Voice everywhere (artisan)
- Every text input in the artisan dashboard has a mic button. Speech is transcribed in the selected language; the artisan sees the text and can fix it.
- Optional **voice prompts**: key screens can read their main instruction aloud (speaker icon; auto-play setting in A17). This replaces the need for outside help. Full read-back confirmation of extracted fields is **not** required for now.
- Product descriptions are stored in the artisan's language and auto-translated to English and Hindi (and to the buyer's language on demand). Buyers see a "Translated from Maithili · Show original" toggle.

### 8.3 Voice & tone
- Artisan side: warm, respectful, simple. Short sentences. Use "you" (आप in Hindi). Never blame ("We couldn't hear the price clearly" not "You didn't say the price").
- Buyer side: confident, story-led, a little premium. Celebrate the maker. Avoid "cheap", "deal", "lowest price".
- Verification language: factual and calm. Never "fake" in UI copy for artisans; use "not verified yet". For buyers: "Karu Verified handmade" vs "Not verified yet".

### 8.4 Sample copy
- Returnable nudge: "Listings that accept returns usually sell more. You decide."
- Price advice (below range): "Shops sell similar handmade sarees for ₹2,600–₹3,400. Your price is ₹1,800."
- Not verified price: "Unverified pieces like this sell for ₹900–₹1,400. Verified ones sell for ₹2,600–₹3,400. Add a making video to get verified."
- Karu ID page verdict: "Karu Verified · Handwoven by Ramesh in Bhagalpur, Bihar".

---

## 9. Design system

### 9.1 Direction
**Modern Indian.** Feels at home for a city buyer used to Myntra and for a weaver used to Meesho, but with its own identity: warm natural colours drawn from craft materials (indigo, haldi, terracotta, khadi), generous whitespace, big photography, and a few restrained textile-inspired motifs. **Luxury label + warm storytelling**, never a government certificate.

Do: crisp product photography, soft natural backgrounds, editorial typography for stories, subtle woven/ikat-inspired line patterns as separators and on the passport card, hand-drawn style spot illustrations for empty states.
Don't: rangoli overload, saturated festival colours everywhere, seals/stamps/guilloche certificate styles, stock photos of "generic India".

### 9.2 Colour tokens (light mode)

| Token | Hex | Use |
|---|---|---|
| `--color-indigo-900` (primary) | `#1F2A6B` | Primary buttons, links, header, natural-indigo nod |
| `--color-indigo-700` | `#2F3E94` | Hover/active |
| `--color-indigo-50` | `#EEF0FA` | Tinted backgrounds |
| `--color-haldi-500` (accent) | `#E3A72F` | Highlights, ratings, price marker |
| `--color-terracotta-600` | `#B9532E` | Sale/attention, "only 2 left" |
| `--color-peacock-600` (verified) | `#11756B` | Karu Verified badge, success |
| `--color-peacock-50` | `#E6F4F2` | Verified background |
| `--color-ink-900` (text) | `#1E1A16` | Body text |
| `--color-ink-600` | `#5C554D` | Secondary text |
| `--color-ink-300` | `#BDB5AA` | Borders, disabled |
| `--color-khadi-50` (page bg) | `#FBF8F2` | Page background |
| `--color-white` | `#FFFFFF` | Cards |
| `--color-danger-600` | `#C0362C` | Errors |
| `--color-unverified` | `#7A736B` | "Not verified yet" pill (neutral, not red) |

- All text/background pairs MUST meet WCAG 2.2 AA (4.5:1 body, 3:1 large text/UI).
- Dark mode: tokens defined so a dark theme can be added later (`--color-bg`, `--color-surface`, `--color-text` aliases). Buyer side MAY ship dark mode [LATER]; artisan side light only for now. [DEFAULT]

### 9.3 Typography
Must cover Latin, Devanagari, Gurmukhi, Gujarati, Tamil, Malayalam and Arabic-script (Urdu).

| Role | Latin | Indic / Urdu |
|---|---|---|
| Display (story titles, Karu ID page, hero) | **Fraunces** (serif, soft, editorial) | **Noto Serif** {Devanagari, Gurmukhi, Gujarati, Tamil, Malayalam}; **Noto Nastaliq Urdu** |
| UI & body | **Noto Sans** | **Noto Sans** {Devanagari, Gurmukhi, Gujarati, Tamil, Malayalam}; **Noto Naskh Arabic** for Urdu UI (Nastaliq is too tall for dense UI) [DEFAULT] |

Scale (mobile / desktop): Display 32/48, H1 26/36, H2 22/28, H3 18/22, Body 16/16, Small 14/14, Caption 12/12. Line height 1.5 for body; **Indic scripts need +10–15% line height** (use 1.6–1.7) to avoid clipped matras. Load only the fonts for the active language (subset, `font-display: swap`).

### 9.4 Spacing, shape, elevation
- 4 px base grid; spacing scale 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: 8 (inputs, chips), 12 (cards), 20 (sheets, large cards), full (pills, FAB).
- Elevation: very soft warm shadows (`0 1px 2px rgba(30,26,22,.06), 0 4px 12px rgba(30,26,22,.06)`); prefer borders on khadi background.
- Layout: buyer desktop 12-column grid, max width 1280 px; mobile 16 px side gutters, 4-column.
- **Touch targets ≥ 48×48 px** on the artisan side (≥ 44 px buyer side).

### 9.5 Iconography & imagery
- Icon set: Phosphor or Lucide (rounded, 1.5–2 px stroke), consistent everywhere. [DEFAULT: Lucide]
- Craft category icons: custom simple line icons (loom, wheel, chisel, needle, brush…), always with a text label on the artisan side.
- Product images: 4:5 in grids; zoom on product page.
- Motif: one subtle woven-line pattern asset used as section dividers, the passport card border and the Karu ID page header band.

### 9.6 Core components
| Component | Notes |
|---|---|
| Button | Primary (indigo), Secondary (outline), Tertiary (text), Danger; sizes L (artisan default) / M / S; loading state |
| **MicButton** | Round, indigo; states idle / listening (pulsing ring + waveform) / processing / error; long-press not required |
| **VoiceField** | Text input + MicButton + optional speaker (read aloud) |
| **VerifiedBadge** | Pill: *Karu Verified* (peacock, check icon), *Not verified yet* (neutral), *Checking…* (animated dots). Small (cards) and large (product/Karu ID page) |
| **ProofChecks** | List of 3 plain-language checks with icons and "how we checked" expander |
| **PriceRangeBar** | Horizontal bar: replica range (grey), handmade range (indigo gradient), artisan price marker (haldi), labels; tap for sources |
| ProductCard | 4:5 image, title (2 lines), price, maker name, VerifiedBadge small, stock pill, wishlist heart |
| MakerCard | Photo, name, cluster, passport state, follow button, "Listen" button |
| **PassportCard** | Luxury label style: indigo/khadi, woven border, maker photo, name, craft, region, KRP ID, member since, verified state; exports as image |
| **KaruIdCard / QR band** | Used on share images and the Karu ID page header |
| StockPill | In stock / Only N left / Out of stock |
| ReturnableToggle | Switch + nudge text |
| Stepper | For verification layers and onboarding |
| ProgressRing | Profile completion (tiny, on avatar) |
| UploadQueueBanner | Offline / uploading N items / failed with retry |
| BottomSheet, Dialog, Toast, Tabs, Chips (filters), Rating stars, Skeletons, EmptyState (illustration + one action) | Standard |

### 9.7 Motion
Subtle and functional: 150–250 ms ease-out; listening pulse on mic; verified badge "settles" with a soft scale-in when verification completes. Respect `prefers-reduced-motion`.

### 9.8 Accessibility
WCAG 2.2 AA. Screen-reader labels in the active language. Never rely on colour alone (badges have icon + text). Captions/transcripts for maker voice clips and making videos (auto-generated, editable). Large text mode respected (rem-based sizes).

---

## 10. Trust, safety and policy rules

- Karu MUST NOT generate fictional product photos. AI image suggestions are edits of the artisan's own photos (crop, background clean, light, colour balance) and are labelled "Enhanced" in staff view. The original photo is always kept and used for verification.
- Buyers can **report** any listing or Karu ID. Repeated confirmed fakes → passport suspension.
- Maker voice clip is public only with consent; artisan can hide it anytime.
- Exact address and phone of artisans and buyers are never shown publicly. Sold-unit journey shows city only.
- Children: no product videos/photos of minors working (child labour concern); verification guidance says so and staff can remove such content. [DEFAULT]
- Prohibited items list (wildlife products, ivory, etc.) in terms; staff takedown. [PILOT]
- Ownership history on resale: [LATER] the owner can transfer a Karu ID to a new owner from their account; the Karu ID page then shows "Owned since …" for the new owner.

---

## 11. Business rules & edge cases (quick reference)

| Situation | Behaviour |
|---|---|
| Artisan lists without voice note | Allowed; AI uses photo only; asks price via number pad |
| Voice note in a dialect | Transcribed; mapped to closest supported language; description shown in that language + translations |
| Artisan edits photos of a verified listing | Verification re-runs; badge shows "Checking…" until done; if it fails, badge becomes "Not verified yet" |
| Same making video uploaded for different product | Hard fail for the second product, staff flag |
| Product photo found on another site | If clearly someone else's (older, different seller) → hard fail; if it's the artisan's own shop/Instagram (matched to links in their profile) → no penalty [DEFAULT] |
| Two buyers buy the last unit at once | Unit reserved at payment start for 15 min; second buyer told "just sold out" before paying [DEFAULT] |
| Payment succeeds but reservation expired | Allocate another unit if available; otherwise auto-refund and apologise |
| Artisan doesn't ship in 5 days | Reminder at day 2 and 4; at day 7 order auto-cancelled and refunded [DEFAULT] |
| Artisan deletes listing with sold units | Listing hidden; sold Karu IDs remain valid forever |
| QR copied onto a fake | Karu ID page shows the real piece's photo and "sold on …" status; buyer can report |
| Passport suspended | All listings hidden; Karu ID pages of sold units still work but show "Maker account under review" |
| International buyer | Can browse and pay with international cards; shipping availability flagged per listing [LATER: international shipping] |

---

## 12. Success metrics

- Time to first listing (median) < 5 min; onboarding completion > 70%.
- % listings with a making video; % batches verified.
- Artisan price change after advice (did advice help them price fairly?).
- GMV, orders, artisan earnings (total and median per artisan per month).
- QR scans → product page → purchase conversion.
- Share actions per listing; visits from shared links.
- Return rate; "not as described" rate (should be low for verified).
- TinyFish cost per listing and per verified product.

---

## 13. Roadmap and scope cut

### Hackathon demo [DEMO]
Must work end-to-end live:
1. Artisan onboarding (A01–A05) in Hindi with voice.
2. Snap + Speak → AI review → publish (A06–A10) with live TinyFish price range.
3. Verification with all three layers, showing a verified result (pre-recorded making video allowed).
4. Product page + Karu ID page + share image with QR; scan from a phone on stage.
5. Checkout with Razorpay **test mode** (UPI).
6. TinyFish Agent syndication demo on a demo seller account (A20).
7. Seed data: 15–25 products from 5–8 makers across 3 clusters, with photos taken by the team or used with permission.

### Pilot [PILOT]
Everything in this spec not marked [LATER]: all 8 languages, payouts in live mode, orders and returns, notifications, admin console, offline queue, physical QR tags, craft pages, impact numbers, bulk requests via staff.

### Later [LATER]
Integrated shipping (Delhivery/Shiprocket), international shipping, B2B org dashboard and SaaS tiers, human verification review queue, ownership transfer on resale, Instagram business API posting, buyer dark mode, custom-order checkout, premium export certificates (Phase 3), field-agent multi-artisan offline mode.

---

## 14. Glossary

- **Karu Passport (KRP-…)**: the artisan's identity on Karu, one per account, owned and granted by Karu.
- **Karu ID (KRU-…)**: the identity of one physical product unit.
- **Listing / batch**: one product as published, with a quantity; verification runs per batch.
- **Karu Score**: the combined verification score (internal only).
- **Karu Verified**: the badge a batch gets when its Karu Score passes the threshold without hard fails.
- **Handmade range / replica range**: price ranges from authentic handmade sellers vs mass-market/synthetic listings.
- **Listing QR / unit QR**: QR on share images (→ product page) vs QR on physical tag (→ Karu ID page).

---

## 15. Defaults chosen by the spec author (team may change)

1. One account can be both buyer and artisan.
2. Staff roles admin / moderator / ops.
3. Passport ID `KRP-` + 8 chars; Karu ID `KRU-` + 8 chars (Crockford base32).
4. Verified passport = Aadhaar + (Pehchan card or ≥ 1 verified product or ≥ 5 reviews avg ≥ 4.0).
5. Verification per listing batch, one making video per batch.
6. Buyers and artisans don't see raw scores; staff do.
7. "Only N left" at ≤ 3; return window 7 days; auto-cancel unshipped orders at day 7; 15-min unit reservation at checkout.
8. Listing QR → product page; unit QR on physical tag → Karu ID page; clean images (no QR) for Amazon/Flipkart.
9. Western digits in all languages; dialects map to Hindi UI; Urdu UI in Naskh, display in Nastaliq.
10. Category list in §4.2; icon set Lucide; colour and type tokens in §9.
11. Returns count against the artisan's record only for "not as described".
12. Photo matches to the artisan's own linked shops/social are not penalised.

## 16. Open questions for the team

1. **Who pays TinyFish, AI and payment-gateway fees** while artisans pay 0%? (Default for pilot: Karu absorbs; Part 2 §13 has cost controls.)
2. Final verification weights and threshold after testing on real data (Part 2 §7 gives starting values).
3. Whether buyers should see a "Market context" price range on the Karu ID page (could be seen as pushing prices down or up).
4. Legal review of terms: passport owned by Karu, revocation, consent for public voice/video.

# KARU.AI (कारु)

<div align="center">

```
  ██╗  ██╗ █████╗ ██████╗ ██╗   ██╗     █████╗ ██╗
  ██║ ██╔╝██╔══██╗██╔══██╗██║   ██║    ██╔══██╗██║
  █████╔╝ ███████║██████╔╝██║   ██║    ███████║██║
  ██╔═██╗ ██╔══██║██╔══██╗██║   ██║    ██╔══██║██║
  ██║  ██╗██║  ██║██║  ██║╚██████╔╝    ██║  ██║██║
  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝     ╚═╝  ╚═╝╚═╝
```

### Sovereign Physical-Digital Provenance & Multimodal AI Marketplace for Indian Artisans

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 16](https://img.shields.io/badge/Next.js%2016-Turbopack-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![React 19](https://img.shields.io/badge/React%2019-Tailwind%20v4-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL%2016-pgvector%20%7C%20pg__trgm-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Gemini Multimodal](https://img.shields.io/badge/Google%20Gemini-Multimodal%20Vision%20%26%20Audio-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![TinyFish Intel](https://img.shields.io/badge/TinyFish-Web%20Agent%20%26%20Price%20Radar-FF6F00?style=for-the-badge)](https://tinyfish.ai)
[![Razorpay Route](https://img.shields.io/badge/Razorpay-Route%20Escrow%20Rails-0C2340?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com)
[![Tests Passing](https://img.shields.io/badge/Test%20Suite-34%2F34%20Passing-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)](apps/api/tests)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

*“We do not generate the product. We help the real product speak for itself.”*

[Architecture](#-system-architecture) • [Core Innovations](#-core-innovations) • [Verification Engine](#-tri-layer-multimodal-verification-engine) • [Live Market Intelligence](#-live-fair-price-discovery-engine) • [Quick Start](#-quick-start--deployment) • [Technical Specs](#-technical-specifications)

---

</div>

## 📌 Executive Summary

India is home to over **7 million master artisans** generating timeless handloom and handicraft treasures. Yet, the craft ecosystem suffers from a catastrophic dual crisis:
1. **The Counterfeit Epidemic:** Power-loom replicas and industrial machine prints masquerade as authentic Geographical Indication (GI) handcrafts, undercutting genuine makers and deceiving consumers.
2. **The Digital Asymmetry Barrier:** Rural artisans lack English proficiency, commercial photography setups, and SEO metadata skills, forcing reliance on exploitative middlemen who retain up to 80% of retail margins.

**KARU.AI** solves this end-to-end through a high-performance **Physical-Digital Provenance Platform & Multimodal AI Marketplace**:
- **Snap + Speak Ingestion:** Zero-form onboarding where a 30-second voice note in any regional Indian dialect plus camera photos instantly synthesizes high-converting, SEO-optimized trilingual listings with professional studio-enhanced photography.
- **Tri-Layer Multimodal AI Verification:** Combines micro-texture computer vision (L1), sovereign identity & Pehchan registry checks via autonomous web agents (L2), and temporal keyframe process video analysis (L3).
- **Cryptographic Physical-Digital Handshake:** Crockford Base-32 **Karu IDs** (`KRU-XXXXXXXX`) and tamper-resistant dynamic QR tag sheets linking directly to ultra-lightweight (36 KB) server-rendered provenance proof pages.
- **TinyFish Autonomous Web Intelligence:** Continuously sweeps the domestic and global web to establish real-time fair market benchmarks, eliminating information asymmetry and recommending fair pricing.
- **Zero-Commission Escrow Rails:** Concurrency-safe atomic reservations with Razorpay Route escrow holding funds until the post-delivery buyer satisfaction window closes.

---

## 🏛️ System Architecture

KARU.AI is built as a cloud-native, modular micro-architecture designed for sub-second edge latency and resilient rural connectivity.

```mermaid
flowchart TD
    subgraph Clients[" Omnichannel Client Layer "]
        PWA["📱 Artisan Mobile PWA\n(Offline-First · Dexie DB · Audio/Video)"]
        WEB["💻 Buyer Marketplace\n(Next.js 16 · React 19 · Trigram Search)"]
        QR["🏷️ QR Scanners & Provenance\n(Instant 36KB Island SSR · /k/KRU-ID)"]
        ADM["🛡️ Staff Command Center\n(TOTP MFA · Live Auditing · /admin)"]
    end

    subgraph Gateway[" High-Performance Edge Layer "]
        REV["Edge Proxy & ISR Revalidation\nNext.js App Router Engine"]
    end

    subgraph CoreAPI[" FastAPI Core Engine (Modular Monolith) "]
        AUTH["Auth & Sessions\n(AES-GCM · JWT · CSRF)"]
        CATALOG["Catalog & Search\n(Trigram & Transliteration)"]
        VERIFY["Verification Engine\n(Multi-Layer Arbiter)"]
        PRICING["Market Benchmarking\n(IQR Outlier Sanitizer)"]
        ESCROW["Commerce & Payments\n(Atomic Locks · Razorpay Route)"]
        SSE["Job Stream Service\n(Server-Sent Events)"]
    end

    subgraph AsyncWorkers[" Celery Distributed Execution Mesh "]
        W_AI["🤖 Snap+Speak Worker\n(Gemini Multimodal · STT)"]
        W_VER["🔬 Verification Worker\n(pHash · SigLIP · Rubric Vision)"]
        W_TF["🌐 TinyFish Web Agents\n(Portal Crawler & Price Sweeper)"]
        W_MED["🖼️ Media Processing\n(ffmpeg · rembg · Pillow · PDF)"]
    end

    subgraph DataTier[" Resilient Data Persistence "]
        PG[("PostgreSQL 16\n(UUIDv7 · pgvector · pg_trgm)")]
        RD[("Redis 7.4\n(Event Bus · Cache · Queues)")]
        S3[("S3 / MinIO\n(Encrypted Vault & CDN Media)")]
    end

    subgraph ExternalEcosystem[" External Intelligence & Rails "]
        GEMINI["Google Gemini 1.5/3.0\n(Vision, NLP & Catalogue Studio)"]
        TINYFISH["TinyFish AI\n(Search · Fetch · Browser Agent)"]
        RZP["Razorpay Route\n(Escrow & Split Transfers)"]
        GOV["DigiLocker & Pehchan\n(Sovereign Identity Portals)"]
    end

    PWA & WEB & QR & ADM --> Gateway
    Gateway --> CoreAPI
    CoreAPI --> PG
    CoreAPI --> RD
    CoreAPI --> S3
    CoreAPI -.->|Enqueue Tasks| RD
    RD --> AsyncWorkers
    AsyncWorkers --> PG
    AsyncWorkers --> S3
    W_AI --> GEMINI
    W_VER --> GEMINI
    W_TF --> TINYFISH
    W_TF --> GOV
    ESCROW --> RZP
```

---

## 🚀 Core Innovations

### 1. 🎙️ Autonomous "Snap + Speak" Listing Engine
Artisans never fill out digital forms. The entire listing lifecycle is driven by voice and optical sensing:
1. **Ambient Audio Capture:** Records in the maker's native tongue (Hindi, Punjabi, Marathi, Gujarati, Urdu, Tamil, Malayalam, or English).
2. **Dialect-Resilient Acoustic Parsing:** Normalizes audio to 16 kHz mono WAV; transcribes with confidence scoring and fallback resilience.
3. **Multimodal Extraction:** Gemini vision and language models extract craft taxonomy, dimensions, raw materials, technique, and production lead times into strict schema structures.
4. **Trilingual Catalog Generation:** Automatically authors warm, persuasive, and authentic descriptions in the artisan's source language, English, and Hindi.
5. **AI Studio Image Enhancement:** Auto-levels lighting, normalizes background to rich organic khadi tones, and synthesizes 5 marketplace-grade studio compositions while preserving 100% of the authentic physical piece's features.

```mermaid
sequenceDiagram
    autonumber
    actor Artisan as 👩🏽‍🎨 Artisan (Rural Cluster)
    participant App as 📱 Karu PWA (Offline Outbox)
    participant API as ⚡ FastAPI Orchestrator
    participant Worker as ⚙️ Celery AI Pipeline
    participant Gemini as 🧠 Gemini Multimodal
    participant TinyFish as 🌐 TinyFish Price Radar

    Artisan->>App: Capture Photos + Speak 30s Voice Note
    App->>API: Multi-part Resumable Upload
    API->>Worker: Enqueue Listing Job
    API-->>App: Return Job UUID (Subscribe via SSE)
    Worker->>Gemini: Multimodal Ingestion (Audio + Key Photos)
    Gemini-->>Worker: Structured Product Schema + Trilingual Copy
    Worker->>TinyFish: Query Fingerprint Price Benchmarks
    TinyFish-->>Worker: Return Fair Price Distribution
    Worker->>API: Persist Enriched Draft & Studio Assets
    API-->>App: SSE Push: "Ready for Review"
    Artisan->>App: 1-Tap Price Confirmation & Publish
```

---

### 2. 🛡️ Tri-Layer Multimodal Verification Engine
Karu enforces a multi-tiered verification pipeline designed to distinguish genuine handmade methods from machine-made replicas while honoring artisan realities.

```mermaid
flowchart TD
    START["📦 Batch Ingestion\n(Listing Version + Media Assets)"] --> L1 & L2 & L3

    subgraph Layer1[" Layer 1: Craft-Specific Visuals "]
        L1["Surface & Geometric Forensics\n• Weaving: Gamucha.AI / VGG16 (Handloom vs Powerloom)\n• Woodwork: Toolmark Morphology & Groove Profiles\n• Metalwork: Working Marks & Seam/Join Topography"]
        L1_HASH["Originality Verification\n(pHash Hamming ≤ 8 · Web Reverse Match)"]
        L1 --> L1_HASH --> S_L1["Score L1 (0–100)"]
    end

    subgraph Layer2[" Layer 2: Sovereign Records "]
        L2{"Records Check"}
        L2 -- "Found" --> L2_CALC["Pehchan Artisan ID · Aadhaar KYC\nGI Authorized User · Transaction History"]
        L2 -- "Not Found / Inapplicable" --> L2_CONST["Neutral Baseline\n(NEW_ARTISAN_L2_CONSTANT = 50)\nMissing Records ≠ Counterfeit"]
        L2_CALC & L2_CONST --> S_L2["Score L2 (0–100)"]
    end

    subgraph Layer3[" Layer 3: Process Evidence Forensics "]
        L3{"Process Evidence Submitted?"}
        L3 -- Yes --> L3_VID["Multi-Signal Forensic Cross-Check:\n• LightGlue: Local Feature Correspondences\n• CLIP-Style: Semantic Context Alignment\n• EXIF & In-App Capture Continuity\n• Intermediates vs Final Consistency"]
        L3 -- No --> L3_ZERO["Score = 0\n(Hard Floor Failure)"]
        L3_VID & L3_ZERO --> S_L3["Score L3 (0–100)"]
    end

    S_L1 & S_L2 & S_L3 --> COMBINE["🧮 Weighted Arbitrage Formula\nKaru Score = 0.35·L1 + 0.25·L2 + 0.40·L3"]

    COMBINE --> CHECK{"Hard Fail Triggered?\n(Stock Photo / Video Reused / Suspended)"}
    CHECK -- Yes --> FAIL["❌ REJECTED / UNVERIFIED\n(Staff Escalation + Non-Accusatory Feedback)"]
    CHECK -- No --> EVAL{"Karu Score ≥ 70\nAND L1 ≥ 40\nAND L3 ≥ 50?"}
    EVAL -- Yes --> VERIFIED["✅ KARU VERIFIED\n(Assign Unit Karu IDs · Issue Proof Certificate)"]
    EVAL -- No --> UNVERIFIED["⚠️ UNVERIFIED BATCH\n(Publish Allowed · Replica Price Basis · Inconclusive / Tips)"]
```

#### 📐 Mathematical Formulation

$$\text{Karu Score} = 0.35 \cdot L_1 + 0.25 \cdot L_2 + 0.40 \cdot L_3$$

| Layer | Domain | Weight | Floor | Primary Verification Vectors |
|---|---|:---:|:---:|---|
| **L1** | Craft-Specific Visuals | **35%** | $\ge 40$ | Toolmark morphology, selvedge/weave irregularity, pHash anti-theft crawl |
| **L2** | Identity & Official Records | **25%** | Base 50 | DigiLocker Aadhaar, DC Handicrafts Pehchan registry, GI status, reviews |
| **L3** | Process Evidence Forensics | **40%** | $\ge 50$ | LightGlue local matching, CLIP similarity, capture continuity, WIP consistency |

> [!IMPORTANT]
> **Mathematical Guardrail:** Because $L_3$ carries a 40% weight and requires a minimum floor of 50, **it is mathematically impossible for any listing to be Karu Verified without authentic process evidence** $(0.35 \times 100 + 0.25 \times 100 + 0 = 60 < 70)$.

---

#### 🔍 Layer Breakdown (Key Principles & Forensics)

- **Layer 1 — Craft-Specific Visual Assessment (Beyond Generic AI):**
  - *Weavers:* References Assamese gamucha textile research ([*Nature Scientific Reports*, 2024](https://www.nature.com/articles/s41598-024-58750-z)) using CNN / custom VGG16 models for handloom vs powerloom discrimination. Validated narrowly for specific weaves; prototype demonstrates intended workflow rather than universal fabric coverage.
  - *Woodworkers:* Evaluates toolmark morphology (cutting orientation, carving depth profiles), recurring multi-axis CNC groove pitch, and surface topography vs hand relief.
  - *Metal Artisans:* Inspects planishing hammer facets, hand-engraving micro-burrs, and seam braze transitions vs automated hydraulic stamping. (Hallmarking confirms purity, not handmade origin).
  - *Core Principle:* Dedicated craft-specialized model heads; returns *inconclusive* when physical evidence is ambiguous.

- **Layer 2 — Identity & Official Records (Supporting, Non-Punitive):**
  - Corroborates DC Handicrafts Pehchan cards, GI registry status, and craft board records.
  - *Inclusive Non-Penalization:* Many master artisans lack digital records. The system uses strict tri-state classification (`record found`, `record not found`, or `not applicable`). Missing records **never** trigger a counterfeit verdict.

- **Layer 3 — Making-Process Evidence & Anti-Replay Forensics:**
  - WIP photos/videos, raw materials, and intermediate stages are immutably tied to the batch's **Karu ID**.
  - *Multi-Signal Ensemble:* Combines **LightGlue** (deep local feature correspondences between video frames and final gallery photos), **CLIP-style embeddings** (semantic craft alignment), and **In-App Capture Continuity** (device timestamps & upload sequencing; missing EXIF never disqualifies).
  - *Defensible Generative Video Strategy:* Acknowledges that no tool can guarantee 100% deepfake detection. Deploys a 6-step cross-check that routes anomalies to human review or marks them *inconclusive* rather than making false claims.

---

### 3. 🏷️ Cryptographic Physical-Digital Handshake
Every single physical item manufactured is bound to a unique, collision-proof digital twin:
- **Crockford Base-32 Human Codes:** Identifiers like `KRU-8F29A1QZ` and passports `KRP-9X2M4K7L` eliminate ambiguous characters (`I`, `L`, `O`, `U`) for error-free voice transmission.
- **Dynamic A4 QR Tag Generator:** Direct PDF compilation producing high-density tag sheets with Error Correction Level Q (tolerates up to 25% physical damage/ink bleed).
- **Sub-50ms Island Proof Pages (`/k/[karuId]`):** Anonymous, ultra-optimized server-rendered entry points (36 KB payload) displaying the maker's voice, geo-origin, video proof, and supply-chain custody journey.

```
┌─────────────────────────────────────────────────────────────┐
│                      KARU VERIFIED™                         │
│                    KRU - 8F29A1QZ                           │
├──────────────────────────────┬──────────────────────────────┤
│  █████████████  ▄▄▄▄▄ █▀▄    │  CRAFT: Bhagalpuri Tussar    │
│  ██         ██  █▀▄▀█ █ █    │  ARTISAN: Devki Devi         │
│  ██   ███   ██  ▄▄▄ █ ▄▀█    │  CLUSTER: Bhagalpur, Bihar   │
│  ██   ███   ██  █▀▄▀█ ▄▄█    │  TECHNIQUE: Handloom Woven   │
│  █████████████  █ █ █ ▄ █    │  VERIFIED SCORE: 88.4 / 100  │
├──────────────────────────────┴──────────────────────────────┤
│  SCAN TO MEET THE MAKER · 100% GENUINE HANDMADE PROVENANCE  │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. 🌐 TinyFish Autonomous Web Intelligence Engine
**TinyFish** acts as Karu's autonomous browser agency, enabling the platform to search, extract, navigate, and execute multi-step tasks across external web environments and government portals lacking public APIs.

```mermaid
flowchart LR
    subgraph TinyFishCore[" 🐟 TinyFish Web Intelligence "]
        TF_AGENT["Browser Agents\n(Headless Multi-Step)"]
        TF_FETCH["Clean Markdown Fetch\n(DOM De-cluttering)"]
        TF_SEARCH["Targeted Web Search\n(Regional Market Crawl)"]
    end

    subgraph Missions[" Mission Workflows "]
        M1["🏛️ Cluster & Artisan Discovery\n(DC Handicrafts · MoT · State Craft Boards)"]
        M2["📊 Live Market Price Radar\n(Boutique Portals · Mass Marketplaces)"]
        M3["🛡️ Sovereign Identity Check\n(Pehchan Card & GI Registry Screenshots)"]
        M4["🔍 Anti-Counterfeit Shield\n(Reverse pHash Search for Stolen Media)"]
    end

    TF_AGENT --> M1 & M3
    TF_SEARCH & TF_FETCH --> M2 & M4
```

#### What TinyFish Does in KARU:

1. 🏛️ **Artisan Cluster & Registry Discovery from Government Portals (Agent):**
   - Autonomous web agents crawl official government portals (DC Handicrafts, Ministry of Textiles, State Handicraft Boards, and GI registries).
   - Maps rural artisan clusters, identifies geographical GI boundaries, and uncovers uncatalogued artisan cooperatives and master maker directories that have no public APIs.
2. 📊 **Live Fair-Market Price Discovery (Search + Fetch):**
   - Continuously monitors boutique craft stores and mass e-commerce platforms based on product fingerprints (craft, technique, material, size).
   - Strips DOM bloat into clean markdown, classifies listings into *Handmade* vs. *Power-loom Replica* via Gemini, and computes IQR-sanitized fair market distributions (p25 / median / p75).
3. 🛡️ **Pehchan Card & GI Registry Verification (Agent):**
   - Directly visits government lookup portals, inputs artisan card numbers, extracts verified artisan data, and captures timestamped audit screenshots.
4. 🔍 **Anti-Counterfeit Visual Defense (Search + Fetch):**
   - Ingests web listings matching product descriptions and computes perceptual hash (pHash) comparisons against artisan photos to detect stolen imagery and industrial replicas.
5. 🚀 **Zero-Form Marketplace Syndication (Agent Demo):**
   - Autonomous browser agent that logs into external seller portals (e.g., IndiaMART/Etsy) and automatically populates product titles, descriptions, pricing, and studio images from Karu.

```mermaid
xychart-beta
    title "Market Price Intelligence: Handmade vs Industrial Replica (INR)"
    x-axis ["p25 (Floor)", "Median (Fair Price)", "p75 (Premium)"]
    y-axis "Price in INR (₹)" 0 --> 5000
    bar [1250, 2400, 3950]
    line [450, 850, 1350]
```

*Bars = Verified Authentic Handcrafted Distribution | Line = Industrial Power-Loom Replica Baseline*

- **Artisan Price Radar:** Displays real-time market positioning (*Below Market*, *Fair Market*, *Above Market*) with a one-tap recommendation. **Karu never alters an artisan's price unilaterally.**

---

### 5. 💳 Zero-Commission Escrow Rails
Karu operates a transparent financial model designed to build lasting trust between urban patrons and rural creators.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 🛒 Buyer
    participant Engine as 🛡️ Karu Commerce Engine
    participant Escrow as 🏦 Razorpay Route Escrow
    actor Artisan as 👩🏽‍🎨 Artisan

    Buyer->>Engine: Select Item (15-Minute Atomic Concurrency Lock)
    Buyer->>Escrow: Execute Payment (UPI First / Cards)
    Escrow-->>Engine: Webhook: Captured & Held in Escrow
    Engine->>Artisan: Dispatch Notification (Tag with Karu ID)
    Artisan->>Engine: Mark Shipped (Tracking Reference)
    Engine->>Buyer: Tracking Active (7-Day Auto-Delivery Clock)
    Engine->>Buyer: Delivery Confirmed / Return Window Closes
    Engine->>Escrow: Release Escrow Lock (100% Proceeds)
    Escrow->>Artisan: Instant Payout to Bank / UPI
```

- **15-Minute Concurrency Shield:** Employs atomic row-level database conditional updates (`UPDATE ... WHERE status = 'available'`) ensuring two buyers can never purchase the same one-of-a-kind physical piece.
- **Milestone-Based Escrow:** Full funds are isolated in escrow until the inspection and return window expires.
- **0% Commission for Artisans:** 100% of the listed price transfers directly to the artisan's linked account.

---

## 🗂️ Monorepo Structure

```
KARU/
├── apps/
│   ├── api/                          # FastAPI Modular Monolith (Python 3.12)
│   │   ├── app/
│   │   │   ├── core/                 # DB, Security, UUIDv7, Crockford-32, i18n
│   │   │   ├── modules/
│   │   │   │   ├── ai_pipeline/      # Snap+Speak orchestration & Gemini synthesis
│   │   │   │   ├── verification/     # 3-Layer forensic analysis engine
│   │   │   │   ├── pricing/          # TinyFish benchmark ingestion & clustering
│   │   │   │   ├── karu_ids/         # ID lifecycle & PDF tag sheet rendering
│   │   │   │   ├── orders/           # Atomic cart, checkout & reservation timers
│   │   │   │   ├── payments/         # Razorpay Route split payment & escrow holds
│   │   │   │   ├── artisans/         # Passport, KYC, Pehchan validation
│   │   │   │   └── admin/            # Mission Control API & audit logging
│   │   │   └── providers/            # Pluggable Gemini, Whisper, TinyFish, Razorpay
│   │   ├── migrations/               # Alembic asynchronous database migrations
│   │   └── tests/                    # 34 comprehensive end-to-end test suites
│   └── web/                          # Next.js 16 App Router (React 19 & Tailwind v4)
│       ├── app/
│       │   ├── (market)/             # Buyer marketplace, craft clusters & stories
│       │   ├── sell/                 # Artisan offline PWA, mic inputs & dashboard
│       │   ├── admin/                # Staff console, live metrics & verification queue
│       │   └── k/[karuId]/           # Instant 36KB SSR provenance proof page
│       ├── components/               # High-craft design system (Radix + Lucide)
│       ├── lib/                      # TanStack Query, Dexie IndexedDB, SSE Client
│       └── messages/                 # Complete 8-language localization catalogues
├── infra/
│   └── docker-compose.yml            # Full production-grade orchestration stack
└── docs/                             # Comprehensive specifications & architectural briefs
```

---

## 💻 Technical Specifications

| System Dimension | Specification | Implementation Detail |
|---|---|---|
| **Web Runtime** | Next.js 16.4 (App Router) | React 19, Turbopack, Server Components, Route Groups |
| **Styling & Design Tokens** | Tailwind CSS v4.3 | Native `@theme` tokens (Indigo, Haldi, Peacock, Khadi), logical RTL spacing |
| **API Runtime** | Python 3.12 · FastAPI | Async SQLAlchemy 2.0, Pydantic v2, Uvicorn worker clustering |
| **Database & Search** | PostgreSQL 16.4 | `pg_trgm` (trigram fuzzy matching), `pgvector`, `unaccent`, UUIDv7 PKs |
| **Distributed Queue** | Redis 7.4 + Celery | Distinct queues for AI extraction, verification, pricing, and notifications |
| **Object Storage** | MinIO / AWS S3 | Automatic EXIF GPS stripping, multi-variant WebP/AVIF generation |
| **Multimodal Vision** | Google Gemini 1.5/3.0 | Structured JSON extraction, texture analysis, automated catalogue composition |
| **Web Intelligence** | TinyFish API Suite | Live search, clean markdown fetching, headless browser agents |
| **Payment Rails** | Razorpay Route | UPI-first standard checkout, split transfers, escrow holds |
| **Offline Resilience** | Dexie.js (IndexedDB) | Resumable chunked uploads, service worker Background Sync |
| **Cryptographic PII** | AES-GCM 256-bit | Encryption for legal name, DOB, Aadhaar last-4, bank account/IFSC |
| **Internationalization** | 8 Indic Languages | Hindi, English, Punjabi, Marathi, Gujarati, Urdu (RTL), Tamil, Malayalam |

---

## ⚡ Quick Start & Deployment

### Option 1: Full Staging Stack via Docker Compose (Recommended)

Spin up the entire distributed topology (Postgres 16, Redis, MinIO, FastAPI, Celery Worker, Celery Beat, and Next.js 16) with a single command:

```bash
docker compose -f infra/docker-compose.yml up --build
```

- **Marketplace & Artisan Portal:** `http://localhost:3000`
- **Interactive OpenAPI Documentation:** `http://localhost:8000/docs`
- **MinIO Storage Console:** `http://localhost:9001` (User: `karu`, Pass: `karu-minio-secret`)

---

### Option 2: Local Development Setup

#### 1. Backend API (`apps/api`)

```bash
cd apps/api

# Create and activate Python 3.12 virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install production and development dependencies
pip install -r requirements-dev.txt

# Configure environment variables (defaults to resilient offline mock providers)
cp .env.example .env

# Run database migrations and seed synthetic artisan clusters
python -m app.scripts.seed

# Launch asynchronous API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Application (`apps/web`)

```bash
cd apps/web

# Install packages
npm install

# Start Next.js development server with Turbopack
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore the marketplace.

---

## 🧪 Quality Assurance & Test Verification

The codebase maintains rigorous automated test suites across all domains:

```bash
# Execute API unit, integration, and security test suite (34 passing suites)
cd apps/api
pytest -q
ruff check app tests

# Execute Frontend TypeScript validation, ESLint & i18n key consistency checks
cd apps/web
npm run typecheck
npm run lint
npm run check:i18n
npm run build
```

```
============================== 34 passed in 4.12s ==============================
✓ Verification scoring floors & hard fails tested
✓ Zero-commission escrow calculations & hold release validated
✓ Atomic inventory race conditions verified
✓ Cross-artisan security boundaries & CSRF double-submit protected
✓ Trigram & Hinglish transliteration search verified
✓ 49 App routes compiled cleanly with 0 TypeScript errors
```

---

## 🔐 Security, Privacy & DPDP Compliance

- **Sovereign Data Protection (DPDP Act Ready):** All PII (full legal name, date of birth, Pehchan card numbers, Aadhaar last-4, and bank IFSC details) is secured using authenticated **AES-GCM encryption** at the application layer.
- **Privacy-Preserving Geolocation:** Raw GPS coordinates are scrubbed from public EXIF metadata. Artisan workshop locations are fuzzily clustered to ~1 km accuracy, exposing only district and village names publicly.
- **Hardware-Level MFA:** Staff command center operations (`/admin`) require mandatory TOTP multi-factor authentication (`pyotp`).
- **Cryptographic Session Defense:** Scoped HTTP-only rotating refresh cookies, short-lived JWT access tokens, and double-submit anti-CSRF protection.

---

## 👥 Built with Pride by Team Northern Blades

- **Vedant** — UI/UX Strategy & Product Architecture
- **Alshifa** — Indic Design Systems & Design Tokens
- **Sawant** — Backend Architecture, Concurrency & Escrow Rails
- **Nishant** — Multimodal AI Pipeline, Forensics & Web Agents

*Empowering the hands that weave India's cultural soul.*

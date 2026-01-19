# 🚀 Landing Page Studio

A powerful, JSON-driven landing page generator built with Next.js 16, React 19, and TypeScript. This system transforms structured JSON data into beautiful, conversion-optimized landing pages with built-in validation, normalization, and theming capabilities.

---

## 📋 Table of Contents

- [Overview](#overview)
- [What's New in Part B](#whats-new-in-part-b)
- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
- [Data Flow](#data-flow)
- [Project Structure](#project-structure)
- [JSON Schema](#json-schema)
- [Validation System](#validation-system)
- [Component Architecture](#component-architecture)
- [Features](#features)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Development Workflow](#development-workflow)
- [Best Practices](#best-practices)
- [Part B Documentation](#part-b-documentation)

---

## 🚨 What's New in Part B

**Multi-Tenant Publishing System** is now live! 🎉

Part B extends the core landing page generator with production-ready features:

### 🚀 Publishing Features

- **One-Click Publish**: Studio UI → Server Action → Database → Live URL
- **Database Persistence**: Supabase PostgreSQL with ACID compliance
- **Content Versioning**: SHA-256 fingerprinting for idempotent publishes
- **On-Demand ISR**: Only changed pages regenerate (sub-second updates)
- **Multi-Tenant Support**: Multiple companies publish to same platform

### 🔒 Security Features

- **Timing-Safe Authentication**: Prevents timing attacks on secrets
- **Input Sanitization**: All user inputs validated with Zod schemas
- **SQL Injection Prevention**: Strict regex patterns + parameterized queries
- **Error Message Sanitization**: Detailed in dev, generic in production
- **Fetch Timeout Protection**: 5-second AbortController prevents hanging

### ⚡ Performance

- **First Publish**: 400-600ms (validation + DB write + revalidate)
- **Idempotent Publish**: 150-250ms (early return, no DB write)
- **Page Load (Cached)**: 50-200ms (ISR served from CDN edge)
- **Throttling**: 15-second window prevents publish spam

### 📚 Full Documentation

See **[README_PART_B.md](./README_PART_B.md)** for complete multi-tenant publishing documentation:
- Environment setup (5 required variables)
- Database schema and migrations
- Publishing flow (10-step process)
- Testing & validation procedures
- Deployment guide (Vercel + Supabase)
- Troubleshooting common issues
- Security best practices
- Rollback procedures

---

## 🌐 What's New in Part D

**Wildcard Subdomain Routing** is now implemented! 🚀

Part D adds enterprise-grade multi-tenant routing with custom subdomains:

### 🎯 Routing Features

- **Dual Routing System**: Both subdomain (adient.cyngn.com) AND path-based (/p/adient) work
- **Wildcard DNS Support**: `*.yourcompany.com` routes all buyer subdomains
- **Middleware-Based**: Automatic subdomain extraction and rewriting
- **Reserved Subdomains**: Protection for www, api, admin, app, etc.
- **Conflict Detection**: Validates subdomain uniqueness per buyer
- **Auto-Sync**: page_url_key automatically equals subdomain for consistency

### 🗄️ Schema Updates

- **Removed**: buyer_name and seller_name columns (use IDs only)
- **Added**: page_url column to store full landing page URLs
- **Added**: campaign_id foreign key to sl_campaigns table
- **Required**: subdomain field is now mandatory for published pages
- **Campaign Integration**: Studio dropdown for campaign selection

### 🔧 Technical Implementation

- **middleware.ts**: Extracts subdomain from hostname, rewrites to /p/[slug] route
- **Subdomain Validation**: DNS-safe regex pattern, reserved name checking
- **Priority Routing**: Subdomain lookup first, falls back to path-based
- **Conflict Checking**: Prevents duplicate subdomains across buyers
- **URL Storage**: Full landing page URL saved to database on publish

### 📦 Code Organization

- **lib/validation/**: Renamed from lib/validate for consistency
- **lib/utils/**: Renamed from lib/util for consistency
- **lib/types/**: Centralized TypeScript type definitions
- **config/**: Application constants (reserved subdomains, regex patterns)

### 🚀 Deployment Requirements

**Vercel Configuration**:
- Add wildcard domain: `*.yourcompany.com`
- Configure DNS CNAME: `* → cname.vercel-dns.com`

**Database Migration**:
```sql
ALTER TABLE landing_pages ADD COLUMN page_url TEXT;
ALTER TABLE landing_pages DROP COLUMN buyer_name, seller_name;
```

---

## 🎯 Overview

### What is Landing Page Studio?

Landing Page Studio is a sophisticated platform that enables rapid creation of high-converting B2B landing pages through a JSON-first approach. It's designed for **multi-company templates** where sellers can create customized landing pages for different buyers.

### Key Benefits

- ✅ **Zero Code Deployment**: Create landing pages by pasting JSON
- ✅ **Multi-Company Support**: Dynamic content for buyer-seller relationships
- ✅ **One-Click Publishing**: Studio → Database → Live URL in <600ms (Part B)
- ✅ **Wildcard Subdomain Routing**: Each buyer gets their own subdomain (Part D)
- ✅ **Dual Routing**: Both subdomain and path-based URLs work (Part D)
- ✅ **Campaign Integration**: Link landing pages to marketing campaigns (Part D)
- ✅ **Validation & Quality Control**: Comprehensive error checking and warnings
- ✅ **SEO Optimized**: Built-in meta tags, performance optimization
- ✅ **Type-Safe**: Full TypeScript coverage with strict validation
- ✅ **Deterministic Output**: SHA-256 content fingerprinting for version control
- ✅ **Responsive Design**: Mobile-first, Tailwind CSS powered UI
- ✅ **Production-Ready Security**: Timing-safe auth, input sanitization, SQL injection prevention (Part B)
- ✅ **On-Demand ISR**: Cache revalidation only for changed pages (Part B)

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT (JSON)                         │
│  Seller pastes/uploads JSON with buyer-specific content     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  VALIDATION LAYER                            │
│  • Required fields check (BuyersName, SellersName, etc.)    │
│  • URL hygiene (HTTPS only)                                 │
│  • Text length limits (soft caps + hard limits)             │
│  • Theme contrast validation (WCAG AA compliance)           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                 ┌──────┴──────┐
                 │   VALID?    │
                 └──────┬──────┘
                        │
            ┌───────────┴───────────┐
            │                       │
         YES│                       │NO
            │                       │
            ▼                       ▼
┌─────────────────────┐   ┌──────────────────┐
│  NORMALIZATION      │   │  ERROR DISPLAY   │
│  • Extract names    │   │  • Show errors   │
│  • Sanitize text    │   │  • Show warnings │
│  • Map to schema    │   │  • Prevent build │
│  • Generate CTAs    │   └──────────────────┘
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│              NORMALIZED CONTENT + SHA-256 HASH               │
│  Deterministic, stable structure ready for rendering        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  RENDERING LAYER                             │
│  • Hero Section (headline, CTA, video)                      │
│  • Benefits Section (operational benefits)                  │
│  • Options Section (pricing/packages)                       │
│  • Proof Section (case study with quote)                    │
│  • Social Proofs (customer stories)                         │
│  • Secondary Benefit (additional highlight)                 │
│  • Seller Info (About Us)                                   │
│  • Footer (branding, copyright)                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              FINAL LANDING PAGE (HTML)                       │
│  SEO-optimized, mobile-responsive, conversion-ready         │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16.0.0 | React meta-framework with App Router |
| **UI Library** | React 19.2.0 | Component-based UI |
| **Styling** | Tailwind CSS 4.0 | Utility-first CSS framework |
| **Language** | TypeScript 5.x | Type safety and developer experience |
| **Build** | Webpack | Module bundling and optimization |
| **Runtime** | Node.js 20+ | Server-side rendering |

---

## 💡 Core Concepts

### 1. **Multi-Company Template System**

The system is designed for **B2B seller-to-buyer relationships**:

- **Buyer**: The target company (e.g., "Adient", "Duke Energy")
- **Seller**: The vendor/provider (e.g., "Cyngn", "BlueGrid Energy")

**Required Fields:**
```json
{
  "BuyersName": "Acme Corporation",    // REQUIRED
  "SellersName": "TechFlow Solutions"  // REQUIRED
}
```

These names are used throughout the page:
- Dynamic headlines: "Make Acme Corporation's operations 40% more efficient"
- Dynamic CTAs: "Talk to TechFlow Solutions"
- Dynamic options title: "How can TechFlow Solutions help Acme Corporation?"
- Dynamic social proofs: "TechFlow Solutions has helped companies like Acme Corporation"

### 2. **Three-Layer Data Model**

#### Layer 1: Raw JSON (Input)
```typescript
interface RawLandingContent {
  BuyersName: string;                              // REQUIRED
  SellersName: string;                             // REQUIRED
  biggestBusinessBenefitBuyerStatement: string;    // REQUIRED (headline)
  synopsisBusinessBenefit?: string;                // Hero subhead
  meetingSchedulerLink?: string;                   // CTA links
  // ... 20+ optional fields
}
```

#### Layer 2: Normalized Content (Internal)
```typescript
interface NormalizedContent {
  title: string;                    // Page title
  meta: SeoMeta;                   // SEO metadata
  brand?: Brand;                   // Theming
  hero: Hero;                      // Main section
  benefits?: Benefits;             // Optional sections
  options?: Options;
  proof?: Proof;
  social?: SocialProofs;
  secondary?: SecondaryBenefit;
  seller?: SellerInfo;
  footer?: Footer;
  content_sha: string;             // SHA-256 fingerprint
}
```

#### Layer 3: Component Props (Rendering)
Each React component receives only its relevant slice of normalized data:
```typescript
<Hero hero={content.hero} />
<Benefits benefits={content.benefits} />
<Options options={content.options} />
```

### 3. **Validation Pipeline**

The validation system has **two levels of checks**:

#### Soft Caps (Warnings)
```typescript
LENGTH_CAPS = {
  HEADLINE: 90 chars,
  SUBHEAD: 220 chars,
  SHORT_DESC: 300 chars,
  OPTIONS_INTRO: 250 chars,
  BENEFIT_BODY: 400 chars,
  QUOTE: 300 chars
}
```
- Triggers yellow warning badge
- User can proceed with warnings
- Best for readability suggestions

#### Hard Limits (Blocking Errors)
```typescript
HARD_LIMITS = {
  HEADLINE: 108 chars (120% of cap),
  SUBHEAD: 264 chars,
  SHORT_DESC: 360 chars,
  OPTIONS_INTRO: 300 chars,
  BENEFIT_BODY: 480 chars,
  QUOTE: 360 chars
}
```
- Triggers red error badge
- Blocks normalization and preview
- Prevents UI/UX degradation

### 4. **Content SHA Generation**

Every normalized content gets a **deterministic SHA-256 hash**:

```typescript
contentSha = SHA256(stableStringify(normalizedContent))
```

**Purpose:**
- Version tracking
- Change detection
- Cache invalidation
- Content fingerprinting

---

## 🔄 Data Flow

### Studio Flow (Paste → Preview)

```
1. USER ACTION
   └─> Paste JSON into Studio textarea
   └─> OR upload JSON file

2. CLICK "Validate & Preview"

3. VALIDATION PHASE
   ├─> validateRequiredFields()
   │   ├─> Check BuyersName exists
   │   ├─> Check SellersName exists
   │   ├─> Check headline exists
   │   └─> Check at least one section exists
   │
   ├─> validateUrls()
   │   ├─> meetingSchedulerLink must be HTTPS
   │   ├─> sellerLinkWebsite must be HTTPS
   │   ├─> sellerLinkReadMore must be HTTPS
   │   └─> socialProofs[].link must be HTTPS
   │
   ├─> validateTextLimits()
   │   ├─> Check all text fields vs HARD_LIMITS
   │   └─> Throw errors if exceeded
   │
   └─> checkTextWarnings()
       ├─> Check all text fields vs LENGTH_CAPS
       └─> Add warnings if exceeded

4. IF ERRORS EXIST
   └─> Display error badges (red)
   └─> Display warning badges (yellow)
   └─> STOP - prevent normalization

5. IF VALID (no errors)
   ├─> NORMALIZATION PHASE
   │   ├─> mapRawToNormalized()
   │   │   ├─> Extract company names
   │   │   ├─> Generate dynamic CTAs
   │   │   ├─> Sanitize all text
   │   │   ├─> Parse Vimeo URLs
   │   │   └─> Build normalized structure
   │   │
   │   └─> computeContentSha()
   │       └─> SHA256(stableStringify(normalized))
   │
   └─> RENDERING PHASE
       └─> <LandingPage content={normalized} />
           ├─> Hero
           ├─> Benefits
           ├─> Options
           ├─> Proof
           ├─> Social Proofs
           ├─> Secondary Benefit
           ├─> Seller Info
           └─> Footer

6. DISPLAY OUTPUTS
   ├─> Show live preview
   ├─> Show content_sha
   ├─> Show suggested page_url_key
   └─> Show warnings (if any)
```

---

## 📁 Project Structure

```
landing-page-studio/
│
├── app/                                 # Next.js App Router
│   ├── globals.css                      # Global styles + Tailwind
│   ├── layout.tsx                       # Root layout
│   ├── page.tsx                         # Home page
│   │
│   ├── (studio)/                        # Studio route group
│   │   └── studio/
│   │       └── page.tsx                 # JSON Studio UI
│   │
│   ├── preview/                         # Preview routes
│   │   └── [slug]/
│   │       └── page.tsx                 # Dynamic preview
│   │
│   └── test-phase*/                     # Test pages
│       └── page.tsx
│
├── components/
│   └── landing/                         # Landing page components
│       ├── LandingPage.tsx              # Main orchestrator
│       ├── Hero.tsx                     # Hero section
│       ├── Benefits.tsx                 # Benefits grid
│       ├── Options.tsx                  # Pricing cards
│       ├── Proof.tsx                    # Case study
│       ├── SocialProofs.tsx             # Customer stories
│       ├── SecondaryBenefit.tsx         # Additional highlight
│       ├── SellerInfo.tsx               # About Us
│       └── Footer.tsx                   # Footer
│
├── lib/                                 # Core business logic
│   ├── actions/                         # Server actions
│   │   └── publishLanding.ts            # Publish action (Part B)
│   │
│   ├── analytics/                       # PostHog analytics (Part C)
│   │   ├── context.ts                   # Context building
│   │   ├── domainAuthorization.ts       # Domain auth
│   │   └── hooks.ts                     # React hooks
│   │
│   ├── db/                              # Database layer (Part B)
│   │   ├── supabase.ts                  # Client & types
│   │   └── publishedLanding.ts          # Query functions
│   │
│   ├── normalize/                       # Normalization layer
│   │   ├── normalized.types.ts          # TypeScript interfaces
│   │   ├── mapRawToNormalized.ts        # Transformer
│   │   ├── hash.ts                      # SHA-256 hashing
│   │   ├── stableStringify.ts           # JSON serialization
│   │   └── vimeo.ts                     # Vimeo URL parsing
│   │
│   ├── validation/                      # Validation layer (Part D)
│   │   ├── index.ts                     # Main validator
│   │   ├── rules.ts                     # Validation rules
│   │   ├── errors.ts                    # Error types
│   │   └── publishMeta.ts               # Publish metadata validation
│   │
│   ├── utils/                           # Utility functions (Part D)
│   │   ├── slug.ts                      # Slug generation
│   │   ├── url.ts                       # URL validation
│   │   ├── contrast.ts                  # WCAG contrast
│   │   └── hash.ts                      # Hash utilities
│   │
│   ├── types/                           # Centralized types (Part D)
│   │   └── index.ts                     # Type exports
│   │
│   └── theme/
│       └── tokens.ts                    # Design tokens
│
├── config/                              # Application config (Part D)
│   └── constants.ts                     # Constants (reserved subdomains, regex)
│
├── middleware.ts                        # Subdomain routing (Part D)
│
├── fixtures/
│   └── sample.json                      # Sample JSON
│
└── docs/                                # Documentation
```

---

## 📝 JSON Schema

### Minimal Required JSON

```json
{
  "BuyersName": "Acme Corporation",
  "SellersName": "TechFlow Solutions",
  "biggestBusinessBenefitBuyerStatement": "Reduce costs by 40%"
}
```

### Complete Example

See `fixtures/sample.json` for a full example with all optional fields.

---

## ✅ Validation System

### Validation Rules

| Rule Category | Check | Action |
|--------------|-------|--------|
| **Required** | BuyersName exists | Block if missing |
| | SellersName exists | Block if missing |
| | Headline exists | Block if missing |
| **URLs** | All links are HTTPS | Block if HTTP |
| **Text Length** | Hard limits (120% over cap) | Block if exceeded |
| | Soft caps (recommended) | Warn if exceeded |

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Visit Studio
http://localhost:3000/studio
```

---

## 🎨 Component Architecture

```
<LandingPage>
  ├─ <Hero>                    # Always rendered
  ├─ <Benefits>                # Conditional
  ├─ <Options>                 # Conditional
  ├─ <Proof>                   # Conditional
  ├─ <SocialProofs>            # Conditional
  ├─ <SecondaryBenefit>        # Conditional
  ├─ <SellerInfo>              # Conditional
  └─ <Footer>                  # Always rendered
```

All sections use **null-rendering** - they auto-hide when data is empty.

---

## 🌟 Features

### Part A: Core Landing Page Generator
- ✅ Multi-company template support
- ✅ Comprehensive validation (errors + warnings)
- ✅ Content normalization & sanitization
- ✅ SHA-256 content fingerprinting
- ✅ SEO optimization
- ✅ Mobile-responsive design
- ✅ Full TypeScript coverage
- ✅ WCAG AA contrast checking
- ✅ Dynamic CTA generation
- ✅ Vimeo video embedding

### Part B: Multi-Tenant Publishing
- ✅ One-click publish from Studio UI
- ✅ Supabase database persistence
- ✅ On-demand ISR cache revalidation
- ✅ Idempotent publishes (SHA-based)
- ✅ Production-ready security hardening
- ✅ Global slug-based URL scheme (`/p/{slug}`)
- ✅ Server actions with timing-safe auth
- ✅ Structured logging for monitoring
- ✅ Throttling (15s window per slug)
- ✅ Vercel deployment ready

### Part D: Wildcard Subdomain Routing (NEW!)
- ✅ Wildcard DNS support (`*.yourcompany.com`)
- ✅ Middleware-based subdomain extraction
- ✅ Dual routing (subdomain + path-based)
- ✅ Reserved subdomain protection
- ✅ Subdomain conflict detection
- ✅ Auto-sync page_url_key = subdomain
- ✅ Campaign integration with foreign key
- ✅ Campaign selection dropdown in Studio
- ✅ URL storage in database (page_url column)
- ✅ Streamlined schema (removed buyer_name/seller_name)
- ✅ DNS-safe subdomain validation

---

## 📚 API Reference

### Main Functions

#### `validateAndNormalize(raw: any): Promise<ValidationResult>`

Main validation and normalization pipeline.

#### `mapRawToNormalized(raw: RawLandingContent): NormalizedContent`

Transforms raw JSON to normalized structure.

#### `computeContentSha(normalized: NormalizedContent): Promise<string>`

Generates SHA-256 content hash.

#### `suggestPageUrlKey(buyer, seller, mmyy, version): string`

Generates SEO-friendly URL slug.

---

## 🎯 Best Practices

### JSON Authoring

✅ **DO:**
- Always include `BuyersName` and `SellersName`
- Use HTTPS for all URLs
- Keep headlines under 90 characters
- Use Vimeo for videos
- Test in Studio before publishing (Part A validation)
- Keep JSON in version control (Git)
- Follow slug naming: `{buyer}-{seller}-{mmyy}` (Part B)

❌ **DON'T:**
- Use HTTP URLs
- Exceed hard text limits
- Omit required fields
- Include sensitive data
- Publish without validating in Studio preview (Part B)
- Use special characters in slugs (Part B)

---

## � Part B Documentation

For complete multi-tenant publishing system documentation, see:

### **[README_PART_B.md](./README_PART_B.md)**

Comprehensive guide covering:
- 🏗️ Architecture overview
- ⚙️ Environment setup (5 required variables)
- 🗄️ Database schema and migrations
- 🛣️ Routes & endpoints (Studio, public pages, revalidate API)
- 📤 Publishing flow (10-step process with diagrams)
- ✅ Testing & validation procedures
- 🚀 Deployment guide (Vercel + Supabase)
- 🔍 Troubleshooting common issues
- 🔒 Security considerations and best practices
- ⚡ Performance optimization techniques
- 🔄 Rollback procedures

### Quick Links

| Topic | File | Description |
|-------|------|-------------|
| **Part A Core** | [README.md](./README.md) | This file - JSON validation, normalization, components |
| **Part B Publishing** | [README_PART_B.md](./README_PART_B.md) | Multi-tenant publishing system |
| **Part D Subdomains** | [PART_D_Wildcard_Subdomains_Implementation.md](./docs/PART_D_Wildcard_Subdomains_Implementation.md) | Wildcard subdomain routing guide |
| **Schema Changes** | [SCHEMA_UPDATE_CHANGELOG.md](./docs/SCHEMA_UPDATE_CHANGELOG.md) | Database schema update history |
| **Implementation Plan** | [PART_B_Phase_Execution](./docs/PART_B_Phase_Execution_with_Copilot_Prompts_MultiTenant.md) | Phase-by-phase execution guide |
| **Security Audit** | [Production Readiness](./docs/PRODUCTION_READINESS_REVIEW.md) | Security audit and recommendations |
| **Phase Summaries** | [docs/phase-doc/](./docs/phase-doc/) | Detailed phase completion docs |

---

## �📄 License

Proprietary software owned by **Hrytos**.

---

## 👥 Team

Built with Next.js 16, React 19, TypeScript 5, and Tailwind CSS 4.

---

**Last Updated**: January 19, 2026  
**Version**: 1.2.0  
**Status**: Part A + Part B + Part D Complete ✅🚀

**Production Ready**: Multi-tenant publishing system with wildcard subdomain routing and security hardening

---

Made with ❤️ by the Hrytos team

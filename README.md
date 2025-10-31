# 🚀 Landing Page Studio

A powerful, JSON-driven landing page generator built with Next.js 16, React 19, and TypeScript. This system transforms structured JSON data into beautiful, conversion-optimized landing pages with built-in validation, normalization, and theming capabilities.

---

## 📋 Table of Contents

- [Overview](#overview)
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

---

## 🎯 Overview

### What is Landing Page Studio?

Landing Page Studio is a sophisticated platform that enables rapid creation of high-converting B2B landing pages through a JSON-first approach. It's designed for **multi-company templates** where sellers can create customized landing pages for different buyers.

### Key Benefits

- ✅ **Zero Code Deployment**: Create landing pages by pasting JSON
- ✅ **Multi-Company Support**: Dynamic content for buyer-seller relationships
- ✅ **Validation & Quality Control**: Comprehensive error checking and warnings
- ✅ **SEO Optimized**: Built-in meta tags, performance optimization
- ✅ **Type-Safe**: Full TypeScript coverage with strict validation
- ✅ **Deterministic Output**: SHA-256 content fingerprinting for version control
- ✅ **Responsive Design**: Mobile-first, Tailwind CSS powered UI

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
│   ├── normalize/                       # Normalization layer
│   │   ├── normalized.types.ts          # TypeScript interfaces
│   │   ├── mapRawToNormalized.ts        # Transformer
│   │   ├── hash.ts                      # SHA-256 hashing
│   │   ├── stableStringify.ts           # JSON serialization
│   │   └── vimeo.ts                     # Vimeo URL parsing
│   │
│   ├── validate/                        # Validation layer
│   │   ├── index.ts                     # Main validator
│   │   ├── rules.ts                     # Validation rules
│   │   └── errors.ts                    # Error types
│   │
│   ├── util/                            # Utility functions
│   │   ├── slug.ts                      # Slug generation
│   │   ├── url.ts                       # URL validation
│   │   └── contrast.ts                  # WCAG contrast
│   │
│   └── theme/
│       └── tokens.ts                    # Design tokens
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
- Test in Studio before deployment

❌ **DON'T:**
- Use HTTP URLs
- Exceed hard text limits
- Omit required fields
- Include sensitive data

---

## 📄 License

Proprietary software owned by **Hrytos**.

---

## 👥 Team

Built with Next.js 16, React 19, TypeScript 5, and Tailwind CSS 4.

---

**Last Updated**: October 31, 2025  
**Version**: 0.1.0  
**Status**: Part A Complete ✅

---

Made with ❤️ by the Hrytos team

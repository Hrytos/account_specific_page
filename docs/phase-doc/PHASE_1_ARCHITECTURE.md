# Phase 1 Architecture Overview

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     RAW JSON INPUT                          │
│  (from seller - arbitrary key order, optional fields)       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ mapRawToNormalized(raw)
                      │ - Extracts fields
                      │ - Sanitizes text
                      │ - Applies fallbacks
                      │ - Builds sections conditionally
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 NORMALIZED CONTENT                          │
│  (canonical structure - still arbitrary key order)         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ stableStringify(normalized)
                      │ - Sorts keys alphabetically
                      │ - Recursive ordering
                      │ - Deterministic output
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 STABLE JSON STRING                          │
│  (keys in lexicographic order - always same format)        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ sha256(stableJson)
                      │ - Web Crypto API
                      │ - SHA256 hash
                      │ - Hex encoding
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONTENT SHA (64 chars)                    │
│  "a3f2e9c8d1b4f6a7..." - deterministic fingerprint         │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
lib/normalize/
│
├── normalized.types.ts          Type Definitions
│   ├── RawLandingContent        Input contract
│   ├── NormalizedContent        Output contract
│   ├── Hero, Benefits, etc.     Section types
│   └── CTA, Media, Quote, etc.  Supporting types
│
├── mapRawToNormalized.ts        Transformation Logic
│   ├── sanitize()               Text cleanup
│   ├── Field extraction         Per spec mapping
│   ├── Fallback logic           Smart defaults
│   └── Conditional building     Only if data exists
│
├── stableStringify.ts           Deterministic Serialization
│   ├── Primitive handling       Direct stringify
│   ├── Array handling           Recursive map
│   ├── Object handling          Sort keys + recurse
│   └── Null/undefined handling  Skip undefined
│
├── hash.ts                      Content Fingerprinting
│   ├── sha256()                 Crypto hashing
│   ├── computeContentSha()      Async SHA256
│   └── computeContentShaSync()  Sync fallback
│
└── index.ts                     Public API
    └── Re-exports all           Clean imports
```

---

## Type Hierarchy

```
NormalizedContent
├── title: string                         [Required]
├── seo?: SeoMeta
│   ├── description?: string
│   └── ogImage?: string | null
├── brand?: Brand
│   ├── logoUrl?: string | null
│   ├── colors?: BrandColors
│   │   ├── primary?: string | null
│   │   ├── accent?: string | null
│   │   ├── bg?: string | null
│   │   └── text?: string | null
│   └── fonts?: BrandFonts
│       ├── heading?: string | null
│       └── body?: string | null
├── hero: Hero                            [Required]
│   ├── headline: string
│   ├── subhead?: string | null
│   ├── cta?: CTA
│   │   ├── text: string
│   │   └── href: string
│   └── media?: Media
│       └── videoUrl?: string | null
├── benefits?: Benefits
│   ├── title?: string | null
│   └── items?: BenefitItem[]
│       ├── title: string
│       └── body?: string | null
├── options?: Options
│   └── cards?: OptionCard[]
│       ├── title: string
│       └── description?: string | null
├── proof?: Proof
│   ├── title?: string | null
│   ├── summaryTitle?: string | null
│   ├── summaryBody?: string | null
│   └── quote?: Quote
│       ├── text?: string | null
│       └── attribution?: Attribution
│           ├── name?: string | null
│           ├── role?: string | null
│           └── company?: string | null
├── social?: SocialProofs
│   └── items?: SocialProofItem[]
│       ├── type?: string | null
│       ├── description?: string | null
│       └── link: string
├── secondary?: SecondaryBenefit
│   ├── title?: string | null
│   └── body?: string | null
├── seller?: SellerInfo
│   ├── body?: string | null
│   └── links?: SellerLinks
│       ├── primary?: string | null
│       └── more?: string | null
└── footer?: Footer
    └── cta?: CTA | null
```

---

## Mapping Matrix

| Input (Raw) | Processing | Output (Normalized) |
|------------|------------|---------------------|
| `biggestBusinessBenefitBuyerStatement` | `sanitize()` | `title` ★ |
| `biggestBusinessBenefitBuyerStatement` | `sanitize()` | `hero.headline` ★ |
| `synopsisBusinessBenefit` | `sanitize()` | `seo.description` |
| `synopsisBusinessBenefit` | `sanitize()` | `hero.subhead` |
| `meetingSchedulerLink` | `sanitize()` → fallback chain | `hero.cta.href` |
| `sellerLinkWebsite` | fallback for CTA | `hero.cta.href` (if no scheduler) |
| `sellerLinkWebsite` | `sanitize()` | `seller.links.primary` |
| `quickDemoLinks` | `sanitize()` | `hero.media.videoUrl` |
| `highestOperationalBenefit.highestOperationalBenefitStatement` | `sanitize()` | `benefits.title` |
| `highestOperationalBenefit.benefits[]` | map + `sanitize()` | `benefits.items[]` |
| `options[]` | map + `sanitize()` | `options.cards[]` |
| `mostRelevantProof.*` | deep copy + `sanitize()` | `proof.*` |
| `socialProofs[]` | map (no URL sanitize) | `social.items[]` |
| `secondHighestOperationalBenefitStatement` | `sanitize()` | `secondary.title` |
| `secondHighestOperationalBenefitDescription` | `sanitize()` | `secondary.body` |
| `sellerDescription` | `sanitize()` | `seller.body` |
| `sellerLinkReadMore` | `sanitize()` | `seller.links.more` |
| CTA href (if exists) | mirror | `footer.cta` |

★ = Required field

---

## Text Sanitization Pipeline

```
Input: "  Hello    World  " (with curly quotes)
  │
  ├─ trim()                 → "Hello    World"
  ├─ replace(/\s+/g, ' ')  → "Hello World"
  ├─ replace(/[""]/g, '"')  → (standardize quotes)
  └─ replace(/['']/g, "'")  → (standardize apostrophes)
  │
Output: "Hello World" (clean, normalized)
```

---

## Stable Stringify Algorithm

```
Input Object: { c: 3, a: 1, b: { z: 2, x: 1 } }

Step 1: Sort top-level keys
  → ["a", "b", "c"]

Step 2: Process each key-value pair
  "a": 1           → "\"a\":1"
  "b": { z, x }    → "\"b\":{...}" (recurse)
  "c": 3           → "\"c\":3"

Step 3 (recursive for "b"): Sort nested keys
  → ["x", "z"]
  "x": 1           → "\"x\":1"
  "z": 2           → "\"z\":2"
  Result           → "{\"x\":1,\"z\":2}"

Step 4: Concatenate
  → "{\"a\":1,\"b\":{\"x\":1,\"z\":2},\"c\":3}"

Output: Always the same for this object structure!
```

---

## SHA256 Hash Generation

```
Normalized Object
      ↓
stableStringify()
      ↓
"{\"a\":1,\"b\":2}" (deterministic string)
      ↓
TextEncoder.encode() → UTF-8 bytes
      ↓
crypto.subtle.digest('SHA-256', bytes)
      ↓
[0xa3, 0xf2, 0xe9, ...] (32-byte buffer)
      ↓
Convert to hex string
      ↓
"a3f2e9c8d1b4f6a7..." (64 hex characters)
```

---

## Conditional Section Building

```typescript
// Only create section if data exists

if (raw.highestOperationalBenefit) {
  normalized.benefits = { ... };  // ✅ Created
} else {
  normalized.benefits = undefined; // ❌ Not created
}

// Renderer checks:
if (normalized.benefits?.items?.length > 0) {
  return <BenefitsSection {...normalized.benefits} />;
}
// Section not rendered if undefined or empty
```

---

## Fallback Chain Example

```typescript
// CTA href priority:
const ctaHref = 
  sanitize(raw.meetingSchedulerLink) ||    // 1st choice
  sanitize(raw.sellerLinkWebsite) ||        // 2nd choice
  '';                                        // Last resort

// Result:
// - If meetingSchedulerLink exists → use it
// - Else if sellerLinkWebsite exists → use it
// - Else → empty string (validator will catch in Phase 2)
```

---

## Import Patterns

```typescript
// Import everything
import {
  // Types
  NormalizedContent,
  RawLandingContent,
  Hero,
  Benefits,
  // Functions
  mapRawToNormalized,
  stableStringify,
  computeContentSha,
} from '@/lib/normalize';

// Or import specific modules
import { mapRawToNormalized } from '@/lib/normalize/mapRawToNormalized';
import type { NormalizedContent } from '@/lib/normalize/normalized.types';
```

---

## Testing Flow

```
1. Create raw JSON sample
   ↓
2. mapRawToNormalized(raw)
   ↓
3. Verify structure matches spec
   ↓
4. stableStringify(normalized)
   ↓
5. Verify determinism (same input → same output)
   ↓
6. computeContentSha(normalized)
   ↓
7. Verify 64-char hex hash
   ↓
8. Re-run with reordered keys
   ↓
9. Verify same hash
   ↓
✅ All tests pass
```

---

## Performance Characteristics

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| `mapRawToNormalized` | O(n) | Linear in input size |
| `stableStringify` | O(n log n) | Key sorting dominates |
| `computeContentSha` | O(n) | Hash computation is linear |
| Overall | O(n log n) | Dominated by stringify |

Where n = total number of fields/items in the content.

---

## Memory Usage

- **Raw JSON**: ~2-5 KB typical
- **Normalized**: ~3-6 KB (adds structure)
- **Stable String**: ~3-6 KB (serialized)
- **Hash**: 64 bytes (output)
- **Peak Memory**: ~15-20 KB per transformation

All well within browser/Node.js memory limits.

---

This architecture diagram should help understand how Phase 1 components work together to transform and fingerprint landing page content deterministically.

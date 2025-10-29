# Phase 1 - Normalized Content Contract & Mapping ✅

## Overview

Phase 1 implements the core data transformation layer that converts raw seller JSON into a normalized, canonical format for rendering. This phase establishes the contract between data providers and the rendering system.

## What Was Implemented

### 1. **TypeScript Type Definitions** (`normalized.types.ts`)

Complete type-safe definitions for:
- ✅ `NormalizedContent` - Complete normalized structure
- ✅ `RawLandingContent` - Input JSON structure
- ✅ Individual section types: `Hero`, `Benefits`, `Options`, `Proof`, `SocialProofs`, etc.
- ✅ Supporting types: `CTA`, `Media`, `BenefitItem`, `Quote`, `Attribution`, etc.

### 2. **Raw → Normalized Mapping** (`mapRawToNormalized.ts`)

Implements `mapRawToNormalized(raw)` with:
- ✅ Field mapping per PART A specification (§3, §4)
- ✅ Text sanitization (trim, whitespace collapse, quote standardization)
- ✅ Fallback logic (e.g., CTA href: `meetingSchedulerLink` → `sellerLinkWebsite`)
- ✅ Conditional section building (only creates sections when data exists)
- ✅ Default CTA text ("Book a meeting")

### 3. **Stable Stringify** (`stableStringify.ts`)

Implements `stableStringify(object)`:
- ✅ Lexicographic (alphabetical) key ordering
- ✅ Recursive handling of nested objects and arrays
- ✅ Deterministic output regardless of input key order
- ✅ Proper handling of `null`, `undefined`, primitives

### 4. **Content Hash Generation** (`hash.ts`)

Implements `computeContentSha(normalized)`:
- ✅ SHA256 hash using Web Crypto API
- ✅ Async implementation (browser + Node.js compatible)
- ✅ Hex-encoded output (64 characters)
- ✅ Composes `stableStringify` for deterministic input
- ✅ Bonus: `computeContentShaSync()` for testing/debugging

### 5. **Test Examples** (`test.example.ts`)

Provides comprehensive test suite demonstrating:
- ✅ Mapping fidelity
- ✅ Deterministic stringify behavior
- ✅ Hash stability across key reorderings
- ✅ Sample raw JSON for reference

## File Structure

```
lib/normalize/
├── normalized.types.ts        # TypeScript type definitions
├── mapRawToNormalized.ts      # Raw → Normalized transformation
├── stableStringify.ts         # Deterministic JSON stringification
├── hash.ts                    # SHA256 content hashing
├── index.ts                   # Re-exports all utilities
└── test.example.ts            # Test suite and examples
```

## Key Mappings (Quick Reference)

| Raw JSON Field | Normalized Field(s) |
|----------------|---------------------|
| `biggestBusinessBenefitBuyerStatement` | `title`, `hero.headline` |
| `synopsisBusinessBenefit` | `seo.description`, `hero.subhead` |
| `meetingSchedulerLink` | `hero.cta.href` (primary) |
| `sellerLinkWebsite` | `hero.cta.href` (fallback), `seller.links.primary` |
| `quickDemoLinks` | `hero.media.videoUrl` |
| `highestOperationalBenefit.*` | `benefits.*` |
| `options[]` | `options.cards[]` |
| `mostRelevantProof.*` | `proof.*` |
| `socialProofs[]` | `social.items[]` |
| `secondHighestOperationalBenefit*` | `secondary.*` |
| `sellerDescription` | `seller.body` |
| `sellerLinkReadMore` | `seller.links.more` |

## Usage Examples

### Basic Normalization

```typescript
import { mapRawToNormalized, computeContentSha } from '@/lib/normalize';

const rawJson = {
  biggestBusinessBenefitBuyerStatement: "Save 40% on operational costs",
  synopsisBusinessBenefit: "AI-powered automation platform...",
  // ... other fields
};

// Transform to normalized format
const normalized = mapRawToNormalized(rawJson);

// Generate deterministic hash
const contentSha = await computeContentSha(normalized);

console.log(normalized.title);        // "Save 40% on operational costs"
console.log(normalized.hero.headline); // Same as title
console.log(contentSha);              // "a3f2e9..." (64 char hex)
```

### Testing Determinism

```typescript
import { stableStringify, computeContentSha } from '@/lib/normalize';

// Same content, different key order
const obj1 = { b: 2, a: 1, c: 3 };
const obj2 = { c: 3, a: 1, b: 2 };

const str1 = stableStringify(obj1);
const str2 = stableStringify(obj2);

console.log(str1 === str2); // true - always produces same output
```

## Acceptance Criteria Status

All Phase 1 criteria met:

- ✅ `mapRawToNormalized(raw)` returns normalized skeleton per PART A §3, §4
- ✅ `stableStringify(normalized)` yields canonical ordering
- ✅ `hash(normalized)` is deterministic across raw-key reorders
- ✅ All TypeScript types defined and exported
- ✅ Text sanitization applied consistently
- ✅ Fallback logic implemented (CTA href, etc.)

## Technical Details

### Text Sanitization

Applied to all text fields:
1. Trim leading/trailing whitespace
2. Collapse multiple spaces to single space
3. Standardize curly quotes to straight quotes (`"` → `"`, `'` → `'`)
4. Normalize smart quotes

### Stable Stringify Algorithm

1. Primitives → `JSON.stringify(value)`
2. Arrays → Recursively stringify each element
3. Objects → Sort keys alphabetically, stringify each key-value pair
4. Skip `undefined` values (not JSON-serializable)
5. Concatenate with minimal separators for canonical form

### SHA256 Hash

- Uses Web Crypto API (`crypto.subtle.digest`)
- Available in modern browsers and Node.js 15+
- Output: 64-character hexadecimal string
- Deterministic: Same input → always same hash

## Testing

Run the test example:

```bash
cd landing-page-studio
npm run dev
```

Then in browser console or Node.js:

```typescript
import { testNormalization } from '@/lib/normalize/test.example';

// Run comprehensive tests
const results = await testNormalization();
console.log(results);
```

## Common Patterns

### Checking if Section Has Content

```typescript
const normalized = mapRawToNormalized(raw);

// These will be undefined if no data provided:
if (normalized.benefits) {
  // Render benefits section
}

if (normalized.options?.cards?.length > 0) {
  // Render options cards
}

if (normalized.proof?.quote?.text) {
  // Render customer quote
}
```

### Fallback Logic

The mapper implements smart fallbacks:

```typescript
// CTA href fallback chain:
// 1. meetingSchedulerLink (preferred)
// 2. sellerLinkWebsite (fallback)
// 3. '' (empty string if neither exists)

const ctaHref = 
  sanitize(raw.meetingSchedulerLink) || 
  sanitize(raw.sellerLinkWebsite) || 
  '';
```

## Known Limitations

1. **No validation** - This phase only transforms data; validation happens in Phase 2
2. **No URL normalization** - URLs are passed through as-is (validation will check them)
3. **No length truncation** - Meta description truncation happens in Phase 2
4. **No Vimeo ID extraction** - Video URL is stored as-is; extraction happens in Phase 2

## Next Steps - Phase 2

Phase 1 is complete! Ready to proceed with **Phase 2: Validation Engine & Error Catalog**

**Phase 2 will add:**
- ✅ Validation rules (required fields, URL checks, length caps)
- ✅ Error catalog with codes and messages
- ✅ `validateAndNormalize()` function
- ✅ Blocking errors vs. warnings
- ✅ Vimeo ID extraction utility

**Copilot Prompt for Phase 2:**
See `docs/PART_A_Phase_Execution_with_Copilot_Prompts.md` - Phase 2 section

---

## Troubleshooting

### "Cannot find module" errors

Ensure TypeScript paths are configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### "crypto is not defined" in Node.js

The Web Crypto API requires Node.js 15+ or use the polyfill:

```typescript
import { webcrypto } from 'crypto';
global.crypto = webcrypto as any;
```

### Hash values differ

Check that:
1. You're using `stableStringify` (not `JSON.stringify`)
2. Input objects are deeply equal (not just reference equal)
3. No `undefined` values in unexpected places

---

**Phase 1 Status:** ✅ Complete  
**Next Phase:** Phase 2 - Validation Engine & Error Catalog  
**Ready to proceed:** Yes

## Quick Reference

```typescript
// Import everything
import {
  // Types
  NormalizedContent,
  RawLandingContent,
  // Functions
  mapRawToNormalized,
  stableStringify,
  computeContentSha,
} from '@/lib/normalize';

// Transform raw → normalized
const normalized = mapRawToNormalized(rawJson);

// Get deterministic hash
const sha = await computeContentSha(normalized);

// Manual stringify (for debugging)
const canonical = stableStringify(normalized);
```

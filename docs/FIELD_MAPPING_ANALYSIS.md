# JSON Field Mapping Analysis

**Date**: October 29, 2025  
**Purpose**: Exact mapping between provided Adient-Cyngn JSON and normalized schema

---

## 🔍 Field-by-Field Comparison

### ✅ Currently Supported (No Changes Needed)

| Provided JSON Field | Current Raw Schema | Normalized Path | Status |
|---------------------|-------------------|-----------------|---------|
| `biggestBusinessBenefitBuyerStatement` | ✅ Exact match | `hero.headline` + `title` | ✅ Supported |
| `synopsisBusinessBenefit` | ✅ Exact match | `hero.subhead` + `seo.description` | ✅ Supported |
| `quickDemoLinks` | ✅ Exact match | `hero.media.videoUrl` | ✅ Supported |
| `meetingSchedulerLink` | ✅ Exact match | `hero.cta.href` (priority 1) | ✅ Supported |
| `sellerLinkWebsite` | ✅ Exact match | `seller.links.primary` + `hero.cta.href` (fallback) | ✅ Supported |
| `sellerLinkReadMore` | ✅ Exact match | `seller.links.more` | ✅ Supported |
| `sellerDescription` | ✅ Exact match | `seller.body` | ✅ Supported |
| `highestOperationalBenefit` | ✅ Exact match | `benefits` | ✅ Supported |
| `highestOperationalBenefit.highestOperationalBenefitStatement` | ✅ Exact match | `benefits.title` | ✅ Supported |
| `highestOperationalBenefit.benefits[]` | ✅ Exact match | `benefits.items[]` | ✅ Supported |
| `highestOperationalBenefit.benefits[].statement` | ✅ Exact match | `benefits.items[].title` | ✅ Supported |
| `highestOperationalBenefit.benefits[].content` | ✅ Exact match | `benefits.items[].body` | ✅ Supported |
| `options[]` | ✅ Exact match | `options.cards[]` | ✅ Supported |
| `options[].title` | ✅ Exact match | `options.cards[].title` | ✅ Supported |
| `options[].description` | ✅ Exact match | `options.cards[].description` | ✅ Supported |
| `socialProofs[]` | ✅ Exact match | `social.items[]` | ✅ Supported |
| `socialProofs[].type` | ✅ Exact match | `social.items[].type` | ✅ Supported |
| `socialProofs[].description` | ✅ Exact match | `social.items[].description` | ✅ Supported |
| `socialProofs[].link` | ✅ Exact match | `social.items[].link` | ✅ Supported |
| `secondHighestOperationalBenefitStatement` | ✅ Exact match | `secondary.title` | ✅ Supported |
| `secondHighestOperationalBenefitDescription` | ✅ Exact match | `secondary.body` | ✅ Supported |

---

### ⚠️ Fields Requiring Minor Mapping Updates

| Provided JSON Field | Current Raw Schema | Issue | Fix Required |
|---------------------|-------------------|-------|--------------|
| `synopsisAutomationOptions` | ❌ Not in schema | New field for Options section intro | Add to RawLandingContent, map to `options.intro` or ignore (not used in current design) |
| `mostRelevantProof.summaryContent` | ⚠️ Schema uses `summaryBody` | Field name mismatch | Update mapping: `summaryContent` → `summaryBody` |
| `mostRelevantProof.quoteContent` | ⚠️ Schema uses nested `quote.text` | Field name mismatch | Update mapping: `quoteContent` → `quote.text` |
| `mostRelevantProof.quoteAuthorFullname` | ⚠️ Schema uses `quote.attribution.name` | Field name mismatch | Update mapping |
| `mostRelevantProof.quoteAuthorDesignation` | ⚠️ Schema uses `quote.attribution.role` | Field name mismatch | Update mapping |
| `mostRelevantProof.quoteAuthorCompany` | ⚠️ Schema uses `quote.attribution.company` | Field name mismatch | Update mapping |

---

## 🔧 Required Changes to `mapRawToNormalized.ts`

### Change 1: Update Proof Section Mapping

**Current Code** (lines ~113-130):
```typescript
// Proof/Case Study section
let proof: Proof | undefined;
if (raw.mostRelevantProof) {
  proof = {
    title: sanitize(raw.mostRelevantProof.title),
    summaryTitle: sanitize(raw.mostRelevantProof.summaryTitle),
    summaryBody: sanitize(raw.mostRelevantProof.summaryBody), // ❌ Wrong field name
    quote: raw.mostRelevantProof.quote
      ? {
          text: sanitize(raw.mostRelevantProof.quote.text),
          attribution: {
            name: sanitize(raw.mostRelevantProof.quote.attribution?.name),
            role: sanitize(raw.mostRelevantProof.quote.attribution?.role),
            company: sanitize(
              raw.mostRelevantProof.quote.attribution?.company
            ),
          },
        }
      : undefined,
  };
}
```

**Updated Code** (should be):
```typescript
// Proof/Case Study section
let proof: Proof | undefined;
if (raw.mostRelevantProof) {
  proof = {
    title: sanitize(raw.mostRelevantProof.title),
    summaryTitle: sanitize(raw.mostRelevantProof.summaryTitle),
    summaryBody: sanitize(raw.mostRelevantProof.summaryContent), // ✅ Use summaryContent from JSON
    quote: {
      text: sanitize(raw.mostRelevantProof.quoteContent), // ✅ Use quoteContent from JSON
      attribution: {
        name: sanitize(raw.mostRelevantProof.quoteAuthorFullname), // ✅ Use quoteAuthorFullname
        role: sanitize(raw.mostRelevantProof.quoteAuthorDesignation), // ✅ Use quoteAuthorDesignation
        company: sanitize(raw.mostRelevantProof.quoteAuthorCompany), // ✅ Use quoteAuthorCompany
      },
    },
  };
}
```

---

### Change 2: Update `RawLandingContent` Interface

**File**: `lib/normalize/normalized.types.ts`

**Current Code** (lines ~232-248):
```typescript
// Proof/Case Study
mostRelevantProof?: {
  title?: string;
  summaryTitle?: string;
  summaryBody?: string; // ❌ Should be summaryContent
  quote?: {
    text?: string;
    attribution?: {
      name?: string;
      role?: string;
      company?: string;
    };
  };
};
```

**Updated Code** (should be):
```typescript
// Proof/Case Study
mostRelevantProof?: {
  title?: string;
  summaryTitle?: string;
  summaryContent?: string; // ✅ Match actual JSON field name
  quoteContent?: string; // ✅ Add top-level quote field
  quoteAuthorFullname?: string; // ✅ Add top-level attribution fields
  quoteAuthorDesignation?: string;
  quoteAuthorCompany?: string;
};
```

---

### Change 3: Add Optional `synopsisAutomationOptions` Field

**File**: `lib/normalize/normalized.types.ts`

**Add to RawLandingContent** (after line ~217):
```typescript
// Options
synopsisAutomationOptions?: string; // ✅ Section intro text
options?: Array<{
  title: string;
  description?: string;
}>;
```

**Note**: Currently, the `Options` component doesn't render intro text. This field can be:
1. **Ignored** (not mapped to normalized schema)
2. **Mapped to `options.intro`** (requires updating `Options` interface)

**Recommendation**: Add `intro?: string` to `Options` interface and render it above the cards.

---

## 📊 Validation Against Provided JSON

### Sample Input (Adient-Cyngn JSON)
```json
{
  "biggestBusinessBenefitBuyerStatement": "Make Adient's manufacturing smart & resilient to volatile markets",
  "synopsisBusinessBenefit": "Layoffs, Plant Shutdowns, Losing Customers...",
  "quickDemoLinks": "https://vimeo.com/919773154",
  "meetingSchedulerLink": "https://meetings.hubspot.com/cseidenberg/abm",
  "highestOperationalBenefit": {
    "highestOperationalBenefitStatement": "Meet 'Smart Manufacturing' goals...",
    "benefits": [
      {
        "statement": "Flexibly scale operations...",
        "content": "Cyngn's on-demand manual to autonomous..."
      }
    ]
  },
  "synopsisAutomationOptions": "The Normal, IL facility could potentially...",
  "options": [
    {
      "title": "Pilot at upcoming Normal, IL facility",
      "description": "The new 85,000 sft. greenhouse site..."
    }
  ],
  "mostRelevantProof": {
    "title": "How One Facility Turned 200 Weekly Trips...",
    "summaryTitle": "200 Weekly Trips — Now Fully Automated",
    "summaryContent": "At U.S. Continental, employees used to make...",
    "quoteContent": "Before deploying Cyngn's autonomous vehicle...",
    "quoteAuthorFullname": "Steve Bergmeyer",
    "quoteAuthorDesignation": "Continuous Improvement & Quality Manager",
    "quoteAuthorCompany": "Coats (Auto Equipment Manufacturer)"
  },
  "socialProofs": [
    {
      "type": "Customer Story",
      "description": "How Coats Saved 500+ Labor Hours...",
      "link": "https://vimeo.com/1086894365"
    }
  ],
  "secondHighestOperationalBenefitStatement": "Autonomous vehicles are more safer...",
  "secondHighestOperationalBenefitDescription": "Cyngn's DriveMod uses LiDAR cameras...",
  "sellerDescription": "Cyngn develops & deploys Autonomous Vehicle...",
  "sellerLinkWebsite": "https://www.cyngn.com/",
  "sellerLinkReadMore": "https://www.cyngn.com/resources/case-studies"
}
```

### Expected Normalized Output
```typescript
{
  title: "Make Adient's manufacturing smart & resilient to volatile markets",
  seo: {
    description: "Layoffs, Plant Shutdowns, Losing Customers...",
    ogImage: null
  },
  hero: {
    headline: "Make Adient's manufacturing smart & resilient to volatile markets",
    subhead: "Layoffs, Plant Shutdowns, Losing Customers...",
    cta: {
      text: "Book a meeting",
      href: "https://meetings.hubspot.com/cseidenberg/abm"
    },
    media: {
      videoUrl: "https://vimeo.com/919773154"
    }
  },
  benefits: {
    title: "Meet 'Smart Manufacturing' goals...",
    items: [
      {
        title: "Flexibly scale operations...",
        body: "Cyngn's on-demand manual to autonomous..."
      }
      // ... 2 more
    ]
  },
  options: {
    intro: "The Normal, IL facility could potentially...", // ✅ NEW (optional)
    cards: [
      {
        title: "Pilot at upcoming Normal, IL facility",
        description: "The new 85,000 sft. greenhouse site..."
      }
      // ... 1 more
    ]
  },
  proof: {
    title: "How One Facility Turned 200 Weekly Trips...",
    summaryTitle: "200 Weekly Trips — Now Fully Automated",
    summaryBody: "At U.S. Continental, employees used to make...", // ✅ Mapped from summaryContent
    quote: {
      text: "Before deploying Cyngn's autonomous vehicle...", // ✅ Mapped from quoteContent
      attribution: {
        name: "Steve Bergmeyer", // ✅ Mapped from quoteAuthorFullname
        role: "Continuous Improvement & Quality Manager", // ✅ Mapped from quoteAuthorDesignation
        company: "Coats (Auto Equipment Manufacturer)" // ✅ Mapped from quoteAuthorCompany
      }
    }
  },
  social: {
    items: [
      {
        type: "Customer Story",
        description: "How Coats Saved 500+ Labor Hours...",
        link: "https://vimeo.com/1086894365"
      }
      // ... 2 more
    ]
  },
  secondary: {
    title: "Autonomous vehicles are more safer...",
    body: "Cyngn's DriveMod uses LiDAR cameras..."
  },
  seller: {
    body: "Cyngn develops & deploys Autonomous Vehicle...",
    links: {
      primary: "https://www.cyngn.com/",
      more: "https://www.cyngn.com/resources/case-studies"
    }
  },
  footer: {
    cta: {
      text: "Book a meeting",
      href: "https://meetings.hubspot.com/cseidenberg/abm"
    }
  }
}
```

---

## ✅ Summary of Required Changes

### High Priority (Blocking)
1. ✅ **Fix Proof field mapping** in `mapRawToNormalized.ts`:
   - `summaryBody` → `summaryContent`
   - `quote.text` → `quoteContent`
   - `quote.attribution.name` → `quoteAuthorFullname`
   - `quote.attribution.role` → `quoteAuthorDesignation`
   - `quote.attribution.company` → `quoteAuthorCompany`

2. ✅ **Update `RawLandingContent` interface** in `normalized.types.ts`:
   - Change `mostRelevantProof` field names to match JSON

### Medium Priority (Enhancement)
3. ⚙️ **Add `synopsisAutomationOptions` support**:
   - Add field to `RawLandingContent`
   - Add `intro?: string` to `Options` interface
   - Update `Options` component to render intro text
   - Update mapping in `mapRawToNormalized.ts`

### Low Priority (Nice to Have)
4. 📝 **Update validation rules** if needed:
   - Add length limit for `synopsisAutomationOptions` (if using)
   - Ensure `quoteContent` validation exists

---

## 🎯 Implementation Order

1. **Update TypeScript types** (`normalized.types.ts`)
2. **Update normalization mapping** (`mapRawToNormalized.ts`)
3. **Update validation rules** (`validate/rules.ts`) - if needed
4. **Update Options component** (`components/landing/Options.tsx`) - if adding intro
5. **Test with provided JSON** (paste into Studio)
6. **Verify all sections render correctly**

---

**Status**: Ready for implementation  
**Estimated Time**: 30-45 minutes  
**Risk**: Low (only field name changes, no logic changes)

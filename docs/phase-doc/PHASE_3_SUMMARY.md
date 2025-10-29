# Phase 3 — Utilities: Slug, URL, Contrast, Theme

**Status:** ✅ Complete  
**Date:** October 28, 2025

## Overview

Phase 3 implements core utilities for slug generation, URL validation, WCAG contrast checking, and theme token management. These utilities support URL-safe identifiers, security compliance, and accessibility standards.

---

## Deliverables

### 1. Slug Utilities (`lib/util/slug.ts`)

**Functions:**
- `slugify(input: string): string`
  - Converts text to URL-safe slugs
  - Pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
  - Lowercase, hyphen-separated, no special characters
  
- `suggestPageUrlKey(buyer, seller, mmyy, version): string`
  - Generates landing page URL keys
  - Format: `buyer-seller-mmyy-vN`
  - Example: `acme-corp-techvendor-inc-1024-v1`
  
- `isValidSlug(slug: string): boolean`
  - Validates slug format against regex pattern

**Examples:**
```typescript
slugify("Hello World!!!") // "hello-world"
slugify("Foo---Bar") // "foo-bar"
suggestPageUrlKey("Acme Corp", "TechVendor", "1024", 1)
// "acme-corp-techvendor-1024-v1"
```

---

### 2. URL Utilities (`lib/util/url.ts`)

**Functions:**
- `isHttpsUrl(url): boolean`
  - Strict HTTPS-only validation
  - Returns `false` for HTTP, protocol-relative, or invalid URLs
  
- `validateHttpsUrl(url): string | null`
  - Validates and normalizes HTTPS URLs
  - Returns normalized URL or `null` if invalid
  
- `isValidUrl(url): boolean`
  - Lenient validation (allows HTTP or HTTPS)

**Security:**
- All external links must use HTTPS
- Validation prevents protocol-relative URLs (`//example.com`)
- Prevents non-secure protocols (FTP, file://, etc.)

**Examples:**
```typescript
isHttpsUrl("https://example.com") // true
isHttpsUrl("http://example.com") // false
isHttpsUrl("//example.com") // false
```

---

### 3. Contrast Utilities (`lib/util/contrast.ts`)

**Functions:**
- `parseColor(color: string): { r, g, b } | null`
  - Parses hex (#RGB, #RRGGBB) and rgb/rgba formats
  
- `getRelativeLuminance(rgb): number`
  - WCAG 2.0 relative luminance calculation (0-1)
  
- `getContrastRatio(foreground, background): number | null`
  - WCAG contrast ratio (1-21)
  - Formula: `(L1 + 0.05) / (L2 + 0.05)`
  
- `ensureReadableTextColor(bg, text, minContrast = 4.5): { text, adjusted }`
  - Auto-adjusts text to black/white if contrast < threshold
  - Returns adjusted color and adjustment flag
  
- `meetsWCAG_AA(fg, bg, isLargeText): boolean`
  - Checks WCAG AA compliance

**WCAG Standards:**
```typescript
WCAG_CONTRAST.AA_NORMAL = 4.5   // Normal text
WCAG_CONTRAST.AA_LARGE = 3.0    // Large text (18pt+)
WCAG_CONTRAST.AAA_NORMAL = 7.0  // Enhanced
WCAG_CONTRAST.AAA_LARGE = 4.5   // Enhanced large
```

**Examples:**
```typescript
getContrastRatio("#000000", "#FFFFFF") // 21 (max)
getContrastRatio("#777", "#FFF") // ~4.47

ensureReadableTextColor("#000", "#333")
// { text: "#FFFFFF", adjusted: true }

meetsWCAG_AA("#FFFFFF", "#2563EB") // true
```

---

### 4. Theme Tokens (`lib/theme/tokens.ts`)

**Exports:**
- `DEFAULT_COLORS` - WCAG AA compliant color palette
- `DEFAULT_FONTS` - Font family stacks
- `DEFAULT_SPACING` - Spacing scale (xs to 2xl)
- `DEFAULT_RADIUS` - Border radius values
- `CSS_VARIABLES` - CSS custom property names
- `generateThemeVariables(config)` - Generate theme CSS vars
- `applyTheme(element, config)` - Apply theme to DOM element

**Default Colors:**
```typescript
{
  primary: '#2563EB',    // Blue 600
  accent: '#7C3AED',     // Violet 600
  bg: '#FFFFFF',         // White
  text: '#1F2937',       // Gray 800
  textLight: '#6B7280',  // Gray 500
  border: '#E5E7EB',     // Gray 200
  success: '#10B981',    // Green 500
  warning: '#F59E0B',    // Amber 500
  error: '#EF4444',      // Red 500
}
```

---

## Integration with Validation

Updated `lib/validate/rules.ts`:
- Replaced inline HTTPS check with `isHttpsUrl()` from `lib/util/url`
- Implemented `checkThemeContrast()` using `getContrastRatio()` from `lib/util/contrast`
- Generates `W-CONTRAST` warning if brand colors have ratio < 4.5:1

**Contrast Validation:**
```typescript
if (raw.brand?.colors?.bg && raw.brand?.colors?.text) {
  const ratio = getContrastRatio(text, bg);
  if (ratio < 4.5) {
    // W-CONTRAST warning issued
  }
}
```

---

## Testing

### Interactive Test Page: `/test-phase3`

**Features:**
1. **Slug Generation Tester**
   - Input text → slugified output
   - Real-time regex validation
   - Page URL key generator with buyer/seller/mmyy/version inputs

2. **URL Validation Tester**
   - HTTPS-only validation
   - Valid URL structure check
   - Test cases with pass/fail examples

3. **Contrast Checker**
   - Visual color picker for foreground/background
   - Live preview with sample text
   - Contrast ratio calculation (X:1)
   - WCAG AA pass/fail status
   - Auto-adjustment preview
   - Color input supports hex codes

**Test Cases:**

| Category | Input | Expected Output |
|----------|-------|-----------------|
| Slug | "Hello World!!!" | "hello-world" |
| Slug | "Foo---Bar" | "foo-bar" |
| URL | https://example.com | ✅ HTTPS |
| URL | http://example.com | ❌ Not HTTPS |
| Contrast | #000 on #FFF | 21:1 (✅ AA) |
| Contrast | #777 on #FFF | ~4.47:1 (✅ AA) |

---

## Acceptance Criteria

### ✅ Slug Rules
- [x] Regex pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$` enforced
- [x] Special characters collapsed to single hyphen
- [x] Leading/trailing hyphens trimmed
- [x] Lowercase conversion

### ✅ URL Validation
- [x] Strict HTTPS-only enforcement
- [x] Invalid URLs return `false` or `null`
- [x] URL constructor validates structure

### ✅ Contrast Calculation
- [x] WCAG 2.0 compliant formula
- [x] Supports hex (#RGB, #RRGGBB) and rgb/rgba formats
- [x] Relative luminance with gamma correction
- [x] Auto-adjustment returns black/white based on background

### ✅ Theme Tokens
- [x] CSS variable names defined
- [x] Default colors meet WCAG AA
- [x] Spacing/radius scales provided
- [x] Theme generation utility

---

## Files Created

```
lib/
  util/
    slug.ts          (70 lines)  - Slug generation & validation
    url.ts           (85 lines)  - HTTPS URL validation
    contrast.ts      (235 lines) - WCAG contrast calculations
  theme/
    tokens.ts        (150 lines) - Theme configuration & CSS vars
app/
  test-phase3/
    page.tsx         (280 lines) - Interactive test suite
```

**Total:** ~820 lines of utilities + tests

---

## Next Steps

**Phase 4 — Renderer Components**
- Create accessible React components (Hero, Benefits, Options, etc.)
- Props-only architecture (no data fetching)
- Skip empty sections without visual gaps
- One H1 (hero), H2 per section
- Vimeo lazy-load, external links with `rel="noopener"`
- Responsive layout (mobile → desktop grid)

**Dependencies:**
- Phase 3 utilities ready for use in components
- Slug generation needed for Phase 5 Studio (URL key suggestion)
- Contrast utilities used for theme validation warnings

---

## Key Learnings

1. **WCAG Contrast Formula** requires gamma correction (sRGB → linear RGB)
2. **Relative Luminance** uses weighted RGB: `0.2126*R + 0.7152*G + 0.0722*B`
3. **Slug Regex** can be validated but simpler to generate correctly upfront
4. **HTTPS Enforcement** prevents downgrade attacks and mixed content warnings
5. **Theme Tokens** centralize design decisions for consistency

---

## API Reference

### Slug API
```typescript
function slugify(input: string): string;
function suggestPageUrlKey(
  buyer: string,
  seller: string, 
  mmyy: string, 
  version: number
): string;
function isValidSlug(slug: string): boolean;
```

### URL API
```typescript
function isHttpsUrl(url: string | undefined | null): boolean;
function validateHttpsUrl(url: string | undefined | null): string | null;
function isValidUrl(url: string | undefined | null): boolean;
```

### Contrast API
```typescript
function parseColor(color: string): { r, g, b } | null;
function getRelativeLuminance(rgb: { r, g, b }): number;
function getContrastRatio(fg: string, bg: string): number | null;
function ensureReadableTextColor(
  bg: string,
  text: string,
  minContrast?: number
): { text: string; adjusted: boolean };
function meetsWCAG_AA(fg: string, bg: string, isLarge?: boolean): boolean;
```

### Theme API
```typescript
interface ThemeConfig {
  colors?: { primary?, accent?, bg?, text? };
  fonts?: { heading?, body? };
}

function generateThemeVariables(config?: ThemeConfig): Record<string, string>;
function applyTheme(element: HTMLElement, config?: ThemeConfig): void;
```

---

**Phase 3 Complete!** All utilities implemented, tested, and integrated with validation engine. Ready to proceed to Phase 4 component development.

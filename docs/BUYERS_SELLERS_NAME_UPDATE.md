# BuyersName & SellersName Field Update

## Summary
Updated the JSON schema to support explicit `BuyersName` and `SellersName` fields at the top level, making it more reliable and explicit than regex-based extraction.

---

## Changes Made

### 1. Schema Update
**File:** `lib/normalize/normalized.types.ts`

Added two new optional fields to `RawLandingContent`:

```typescript
export interface RawLandingContent {
  // Company names (new fields)
  BuyersName?: string;
  SellersName?: string;

  // Required fields
  biggestBusinessBenefitBuyerStatement: string;
  // ... rest of fields
}
```

### 2. Mapping Logic Update
**File:** `lib/normalize/mapRawToNormalized.ts`

Updated Options section mapping to prioritize explicit fields with fallback to extraction:

```typescript
// Options section
let options: Options | undefined;
if (raw.options && raw.options.length > 0) {
  // Use direct BuyersName and SellersName fields if provided, 
  // otherwise fall back to extraction
  const buyerName = raw.BuyersName || extractBuyerName(raw.biggestBusinessBenefitBuyerStatement);
  const sellerName = raw.SellersName || extractSellerName(raw.sellerDescription);
  
  // Generate title: "How can [Seller] help [Buyer] ?"
  const optionsTitle = buyerName && sellerName
    ? `How can ${sellerName} help ${buyerName} ?`
    : null;
  
  options = {
    title: sanitize(optionsTitle),
    intro: sanitize(raw.synopsisAutomationOptions),
    cards: raw.options.map((opt) => ({
      title: sanitize(opt.title) || '',
      description: sanitize(opt.description),
    })),
  };
}
```

**Key Benefits:**
- ✅ Explicit company names are more reliable
- ✅ Falls back to regex extraction for backward compatibility
- ✅ No breaking changes to existing JSON files
- ✅ More control for content creators

### 3. Sample JSON Update
**File:** `public/adient-cyngn-sample.json`

Added the new fields at the top:

```json
{
  "BuyersName": "Adient",
  "SellersName": "Cyngn",
  "biggestBusinessBenefitBuyerStatement": "Make Adient's manufacturing smart & resilient to volatile markets",
  ...
}
```

---

## Behavior

### With Explicit Fields (Recommended)
```json
{
  "BuyersName": "Duke Energy",
  "SellersName": "BlueGrid Energy",
  ...
}
```
**Result:** Options title = `"How can BlueGrid Energy help Duke Energy ?"`

### Without Explicit Fields (Fallback)
```json
{
  "biggestBusinessBenefitBuyerStatement": "Make Duke Energy's grid smarter...",
  "sellerDescription": "BlueGrid Energy develops smart grid solutions...",
  ...
}
```
**Result:** Options title = `"How can BlueGrid Energy help Duke Energy ?"` (extracted via regex)

### No Fields Available
```json
{
  "biggestBusinessBenefitBuyerStatement": "Improve your operations",
  "sellerDescription": "We build solutions",
  ...
}
```
**Result:** Options title = `null` (section renders without title)

---

## Validation

### ✅ Build Status
```
✓ Compiled successfully
✓ Finished TypeScript in 3.9s
0 TypeScript errors
```

### ✅ Backward Compatibility
- Old JSON files without `BuyersName`/`SellersName` still work
- Regex extraction functions remain as fallback
- No breaking changes

---

## Usage Recommendation

**For new JSON files, always include:**
```json
{
  "BuyersName": "Company Name",
  "SellersName": "Seller Name",
  ...
}
```

**Benefits:**
- More reliable (no regex parsing)
- Explicit control over company names
- Handles edge cases (e.g., "Duke Energy & Progress Energy")
- Faster processing (no regex needed)

---

## Migration Guide

### Old Format (Still Works)
```json
{
  "biggestBusinessBenefitBuyerStatement": "Make Adient's manufacturing...",
  "sellerDescription": "Cyngn develops & deploys..."
}
```

### New Format (Recommended)
```json
{
  "BuyersName": "Adient",
  "SellersName": "Cyngn",
  "biggestBusinessBenefitBuyerStatement": "Make Adient's manufacturing...",
  "sellerDescription": "Cyngn develops & deploys..."
}
```

**Action Required:** None - both formats work. Add explicit fields when creating new JSON files.

---

## Files Modified

1. ✅ `lib/normalize/normalized.types.ts` - Added BuyersName/SellersName fields
2. ✅ `lib/normalize/mapRawToNormalized.ts` - Updated mapping with fallback logic
3. ✅ `public/adient-cyngn-sample.json` - Added example fields

---

## Testing

Verified with build:
- TypeScript compilation: ✅ Success
- Static generation: ✅ 10 pages
- No errors or warnings

Ready for production use! 🎉

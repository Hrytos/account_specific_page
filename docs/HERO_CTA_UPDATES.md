# Hero & CTA Button Updates

## Summary
Enhanced the Hero section to display both descriptions and made all CTA buttons dynamic using the seller's name.

---

## Changes Made

### 1. Hero Section - Added Short Description Field

**Files Modified:**
- `lib/normalize/normalized.types.ts`
- `lib/normalize/mapRawToNormalized.ts`
- `components/landing/Hero.tsx`

**Schema Update:**
```typescript
export interface Hero {
  headline: string;
  subhead?: string | null;
  shortDescription?: string | null; // NEW: Additional description field
  cta?: CTA;
  media?: Media;
  sellerName?: string | null; // NEW: For dynamic CTA text
}

export interface RawLandingContent {
  // ... existing fields
  shortDescriptionBusinessBenefit?: string; // NEW: Maps to hero.shortDescription
}
```

**Behavior:**
Now both descriptions are displayed in the Hero section:
1. **synopsisBusinessBenefit** → Large text (text-lg, text-gray-600)
2. **shortDescriptionBusinessBenefit** → Slightly smaller (text-base, text-gray-700)

**Visual Layout:**
```
Headline (H1)
  ↓
synopsisBusinessBenefit (larger, gray-600)
  ↓
shortDescriptionBusinessBenefit (smaller, gray-700)
  ↓
"Talk to [Seller]" Button
```

---

### 2. Dynamic CTA Button Text

**Changed:** All CTA buttons now use dynamic seller name

#### Hero Section Button
**Before:**
```typescript
cta: {
  text: 'Book a meeting',
  href: ctaHref,
}
```

**After:**
```typescript
const ctaText = raw.SellersName 
  ? `Talk to ${raw.SellersName}`
  : 'Book a meeting';

cta: {
  text: ctaText,
  href: ctaHref,
}
```

**Result with Adient-Cyngn JSON:**
- Button text: `"Talk to Cyngn"` ✅

---

### 3. SecondaryBenefit Section - Added Button

**Files Modified:**
- `lib/normalize/normalized.types.ts`
- `lib/normalize/mapRawToNormalized.ts`
- `components/landing/SecondaryBenefit.tsx`

**Schema Update:**
```typescript
export interface SecondaryBenefit {
  title?: string | null;
  body?: string | null;
  link?: string | null; // NEW: Link to learn more
  sellerName?: string | null; // NEW: For dynamic button text
}
```

**Mapping:**
```typescript
secondary = {
  title: sanitize(raw.secondHighestOperationalBenefitStatement),
  body: sanitize(raw.secondHighestOperationalBenefitDescription),
  link: sanitize(raw.sellerLinkWebsite) || sanitize(raw.sellerLinkReadMore),
  sellerName: raw.SellersName || null,
};
```

**Component Update:**
```typescript
const buttonText = secondary.sellerName 
  ? `Talk to ${secondary.sellerName}`
  : 'Learn More';

{secondary.link && (
  <a
    href={secondary.link}
    className="inline-flex items-center px-10 py-4 bg-white hover:bg-gray-50 text-blue-700 font-semibold text-lg rounded-lg shadow-lg"
  >
    {buttonText}
    <svg>→</svg>
  </a>
)}
```

**Button Styling:**
- Padding: `px-10 py-4` (wider button ✅)
- Background: White on blue section
- Text: Blue-700 color
- Shadow: Large shadow with hover effect
- Arrow icon included

**Result with Adient-Cyngn JSON:**
- Button text: `"Talk to Cyngn"` ✅
- Button width: Wider due to `px-10` (was `px-8`)

---

## Visual Examples

### Hero Section (Image 1)
```
Make Adient's manufacturing smart & resilient to volatile markets
[Large headline]

Layoffs, Plant Shutdowns, Losing Customers, EHS penalties & New EV
Business Lines - there is so much volatility. Become resilient by
automating movement of assemblies - seat-frame, cushion and other
material handling tasks.
[synopsisBusinessBenefit - larger, gray-600]

Volatile markets, perennial labor shortage and increasing customer
expectations make it increasingly important to find the right automation
partner for Adient who can delicately balance - immediate benefits,
quick RoI, flexibility and reliability. Cyngn can be that trusted
partner for Adient.
[shortDescriptionBusinessBenefit - smaller, gray-700]

[Talk to Cyngn] ← Dynamic button
```

### SecondaryBenefit Section (Image 2)
```
Autonomous vehicles are more safer, viable & flexible than
retrofitting existing forklifts with safety packages.
[White text on blue gradient background]

Cyngn's DriveMod uses LiDAR cameras & advanced AI to safely navigate
its way around your shop floor while avoiding obstacles - pedestrians,
other vehicles & stationary objects. Minimise accidents and make
workplace safer with Cyngn
[Light blue-100 text]

[Talk to Cyngn] ← Dynamic button (white bg, blue text, wider)
```

---

## JSON Field Mapping

| Raw JSON Field | Normalized Field | Component | Display |
|----------------|------------------|-----------|---------|
| `SellersName` | `hero.sellerName` | Hero | Button: "Talk to {name}" |
| `synopsisBusinessBenefit` | `hero.subhead` | Hero | Large gray text |
| `shortDescriptionBusinessBenefit` | `hero.shortDescription` | Hero | Smaller gray text |
| `meetingSchedulerLink` | `hero.cta.href` | Hero | Button link |
| `SellersName` | `secondary.sellerName` | SecondaryBenefit | Button: "Talk to {name}" |
| `sellerLinkWebsite` | `secondary.link` | SecondaryBenefit | Button link |

---

## Fallback Behavior

### If SellersName is Missing
```typescript
// Hero button
text: 'Book a meeting' // Fallback

// SecondaryBenefit button
text: 'Learn More' // Fallback
```

### If shortDescriptionBusinessBenefit is Missing
- Section just doesn't render (no gap left behind)
- Only `synopsisBusinessBenefit` shows

### If sellerLinkWebsite is Missing
- SecondaryBenefit tries `sellerLinkReadMore` as fallback
- If both missing, no button shows (decorative line appears instead)

---

## Build Verification

```
✓ Compiled successfully in 4.0s
✓ Finished TypeScript in 4.0s
✓ Generating static pages (10/10)
0 TypeScript errors
```

---

## Button Comparison

| Button | Before | After |
|--------|--------|-------|
| Hero CTA | "Book a meeting" | "Talk to Cyngn" |
| SecondaryBenefit | (No button) | "Talk to Cyngn" (wider: px-10) |

---

## Testing Checklist

✅ Hero displays both `synopsisBusinessBenefit` and `shortDescriptionBusinessBenefit`  
✅ Hero button text: "Talk to Cyngn" (dynamic)  
✅ SecondaryBenefit button text: "Talk to Cyngn" (dynamic)  
✅ SecondaryBenefit button is wider (px-10 vs px-8)  
✅ Fallback to "Book a meeting" / "Learn More" when SellersName missing  
✅ TypeScript compilation: 0 errors  
✅ All sections render correctly

Ready for production! 🎉

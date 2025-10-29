# Phase 4 Components - Quick Reference

## 🎨 Component Overview

All components are in `components/landing/`

```typescript
import {
  Hero,
  Benefits,
  Options,
  Proof,
  SocialProofs,
  SecondaryBenefit,
  SellerInfo,
  Footer,
} from '@/components/landing';

// Or use the master component
import { LandingPage } from '@/components/landing/LandingPage';
```

---

## 📦 Component Checklist

| Component | H1/H2 | Skips Empty | Responsive | Vimeo Support |
|-----------|-------|-------------|------------|---------------|
| Hero | ✅ H1 | ✅ | ✅ | ✅ Lazy |
| Benefits | H2 | ✅ | ✅ 3-col | N/A |
| Options | H2 | ✅ | ✅ 3-col | N/A |
| Proof | H2 | ✅ | ✅ | N/A |
| SocialProofs | H2 | ✅ | ✅ 3-col | N/A |
| SecondaryBenefit | H2 | ✅ | ✅ | N/A |
| SellerInfo | H2 | ✅ | ✅ | N/A |
| Footer | None | ❌ Always | ✅ | N/A |

---

## 🚀 Quick Start

### Render Full Landing Page

```tsx
import { LandingPage } from '@/components/landing/LandingPage';
import { validateAndNormalize } from '@/lib/validate';

const { normalized, isValid } = await validateAndNormalize(rawJSON);

if (isValid && normalized) {
  return <LandingPage content={normalized} />;
}
```

### Render Individual Sections

```tsx
import { Hero, Benefits } from '@/components/landing';

<Hero hero={normalized.hero} />
<Benefits benefits={normalized.benefits} />
```

---

## ♿ Accessibility Features

**Semantic HTML:**
- One `<h1>` in Hero only
- Each section has `<h2>`
- Proper `<footer>`, `<blockquote>`, `<cite>` tags

**Keyboard Navigation:**
- All links/buttons have `focus:ring-4`
- Tab through all interactive elements
- Visible focus states

**External Links:**
- `target="_blank" rel="noopener noreferrer"`
- Security best practice

---

## 📱 Responsive Breakpoints

```css
Default: Single column (mobile)
md: (768px+) 2-column layouts
lg: (1024px+) 3-column grids
```

**Grid Patterns:**
```tsx
// Hero: Text | Media
grid-cols-1 md:grid-cols-2

// Benefits/Options/Social: 3-column
grid-cols-1 md:grid-cols-3
```

---

## 🎬 Video Handling

```tsx
// Vimeo: Lazy-loaded embed
{vimeoId && (
  <iframe
    src={getVimeoEmbedUrl(vimeoId)}
    loading="lazy"
    ...
  />
)}

// Non-Vimeo: Button to open in new tab
{!vimeoId && (
  <a href={videoUrl} target="_blank" rel="noopener">
    Watch Demo
  </a>
)}
```

---

## 🎨 Design Tokens

**Colors:**
- Primary: `bg-blue-600` (buttons)
- Secondary: `bg-indigo-600` (SecondaryBenefit)
- Neutral: `bg-gray-50` (alternating sections)

**Spacing:**
- Section: `py-16 md:py-24`
- Container: `max-w-6xl mx-auto px-4 md:px-6`

**Shadows:**
- Cards: `shadow-md hover:shadow-lg`
- CTAs: `shadow-lg hover:shadow-xl`

---

## 🧪 Testing

**Test Page:** http://localhost:3000/test-phase4

**Preview Route:** http://localhost:3000/preview/any-slug

**Debug:**
- Click "Show JSON" to inspect normalized data
- Resize window to test responsive behavior
- Tab through page to test keyboard navigation

---

## ✅ Empty Section Behavior

All components (except Footer) auto-skip if empty:

```tsx
if (!hero || !hero.headline) {
  return null; // No gap in layout
}
```

**Result:** Seamless flow between populated sections only.

---

## 🔗 Integration with Studio

Phase 5 will integrate these components into the Studio page:

```tsx
// In Studio page after validation
{validationResult.isValid && validationResult.normalized && (
  <div className="mt-8">
    <h3>Preview:</h3>
    <LandingPage content={validationResult.normalized} />
  </div>
)}
```

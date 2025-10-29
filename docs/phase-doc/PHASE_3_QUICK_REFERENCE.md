# Phase 3 Utilities - Quick Reference

## 🔗 Slug Generation

```typescript
import { slugify, suggestPageUrlKey } from '@/lib/util/slug';

// Basic slugify
slugify("Hello World!!!") // "hello-world"

// Landing page URL key
suggestPageUrlKey("Acme Corp", "TechVendor", "1024", 1)
// Result: "acme-corp-techvendor-1024-v1"
```

**Pattern:** `^[a-z0-9]+(?:-[a-z0-9]+)*$`

---

## 🌐 URL Validation (HTTPS Only)

```typescript
import { isHttpsUrl } from '@/lib/util/url';

isHttpsUrl("https://example.com") // ✅ true
isHttpsUrl("http://example.com")  // ❌ false (not HTTPS)
isHttpsUrl("//example.com")       // ❌ false (protocol-relative)
```

**Use in validation:**
- All external links must be HTTPS
- `meetingSchedulerLink`, `sellerLinkWebsite`, `socialProofs[].link`

---

## 🎨 WCAG Contrast Checker

```typescript
import { 
  getContrastRatio, 
  ensureReadableTextColor,
  meetsWCAG_AA 
} from '@/lib/util/contrast';

// Calculate ratio
getContrastRatio("#000000", "#FFFFFF") // 21:1 (perfect)
getContrastRatio("#777777", "#FFFFFF") // ~4.47:1

// Check compliance
meetsWCAG_AA("#FFFFFF", "#2563EB") // true

// Auto-adjust text color
ensureReadableTextColor("#000000", "#333333")
// { text: "#FFFFFF", adjusted: true }
```

**WCAG Standards:**
- Normal text: 4.5:1 (AA) / 7.0:1 (AAA)
- Large text: 3.0:1 (AA) / 4.5:1 (AAA)

---

## 🎭 Theme Tokens

```typescript
import { 
  DEFAULT_COLORS, 
  generateThemeVariables,
  applyTheme 
} from '@/lib/theme/tokens';

// Use default colors
const primaryColor = DEFAULT_COLORS.primary; // "#2563EB"

// Generate CSS variables
const vars = generateThemeVariables({
  colors: {
    primary: '#7C3AED',
    accent: '#10B981'
  }
});

// Apply to element
applyTheme(document.body, {
  colors: { primary: '#7C3AED' }
});
```

---

## 🧪 Test Page

Visit **http://localhost:3000/test-phase3** to:
- Test slug generation with custom inputs
- Validate HTTPS URLs
- Check contrast ratios with color picker
- See auto-adjustment in action

---

## ✅ Validation Integration

The validation engine now uses these utilities:

```typescript
// In lib/validate/rules.ts
import { isHttpsUrl } from '@/lib/util/url';
import { getContrastRatio } from '@/lib/util/contrast';

// HTTPS validation
if (!isHttpsUrl(raw.meetingSchedulerLink)) {
  errors.push(E-URL-SCHED);
}

// Contrast warning
if (ratio < 4.5) {
  warnings.push(W-CONTRAST);
}
```

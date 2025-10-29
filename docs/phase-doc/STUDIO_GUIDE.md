# Studio Usage Guide - Visual Walkthrough

This guide shows you exactly how to use the Landing Page Studio to validate and preview your landing pages.

---

## Opening the Studio

1. Start your dev server:
```bash
npm run dev
```

2. Navigate to:
```
http://localhost:3000/studio
```

---

## Studio Interface Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🎨 Landing Page Studio                                                 │
│  Paste → Validate → Normalize → Preview                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📋 Page Metadata ─────────────────────────────────────────────────     │
│  ┌──────────────┬──────────────┬──────────────┬──────────────────────┐ │
│  │ Buyer ID *   │ Buyer Name   │ Seller ID *  │ Seller Name          │ │
│  │ buyer-123    │ Acme Corp    │ seller-456   │ Widget Inc           │ │
│  └──────────────┴──────────────┴──────────────┴──────────────────────┘ │
│  ┌──────────────┬──────────────┐                                        │
│  │ MMYY *       │ Version      │                                        │
│  │ 0125         │ 1            │                                        │
│  └──────────────┴──────────────┘                                        │
│                                                                          │
│  🔗 Suggested URL Key: buyer-123-widget-inc-0125-v1                     │
│                                                                          │
├──────────────────────────────┬──────────────────────────────────────────┤
│  LEFT COLUMN                 │  RIGHT COLUMN                            │
│                              │                                          │
│  📄 JSON Content             │  👁️ Live Preview                        │
│  ┌──────────────────────┐    │  ┌──────────────────────────────────┐  │
│  │ {                    │    │  │                                  │  │
│  │   "title": "...",    │    │  │  ┌────────────────────────────┐ │  │
│  │   "hero": {          │    │  │  │ HERO SECTION               │ │  │
│  │     "headline": "...",│   │  │  │ Welcome to Our Platform!   │ │  │
│  │     "subhead": "...", │   │  │  │ [Start Free Trial →]       │ │  │
│  │     "cta": {          │   │  │  └────────────────────────────┘ │  │
│  │       "text": "...",  │   │  │                                  │  │
│  │       "href": "..."   │   │  │  ┌────────────────────────────┐ │  │
│  │     }                 │   │  │  │ BENEFITS SECTION           │ │  │
│  │   },                  │   │  │  │ ✓ Fast    ✓ Secure        │ │  │
│  │   "benefits": {...}   │   │  │  └────────────────────────────┘ │  │
│  │ }                     │   │  │                                  │  │
│  └──────────────────────┘    │  │  ┌────────────────────────────┐ │  │
│                              │  │  │ OPTIONS (PRICING)          │ │  │
│  📁 Upload File  🗑️ Clear   │  │  │ [Card] [Card] [Card]       │ │  │
│                              │  │  └────────────────────────────┘ │  │
│  ┌──────────────────────┐    │  │                                  │  │
│  │ ✅ Validate & Normalize│  │  │  ... (more sections) ...        │  │
│  └──────────────────────┘    │  │                                  │  │
│                              │  └──────────────────────────────────┘  │
│  🔍 Validation Results       │                                          │
│  ┌──────────────────────┐    │  📊 Quick Stats                         │
│  │ ✅ Valid - Ready!    │    │  ┌────────────┬─────────────────────┐  │
│  │                      │    │  │ Page Title │ CTA Text            │  │
│  │ 🔐 Content SHA-256:  │    │  │ My Page    │ Start Free Trial    │  │
│  │ abc123def456...      │    │  └────────────┴─────────────────────┘  │
│  │                      │    │                                          │
│  │ ⚠️ Warnings (1):     │    │                                          │
│  │ W-HERO-LONG          │    │                                          │
│  │ Headline is long     │    │                                          │
│  └──────────────────────┘    │                                          │
│                              │                                          │
└──────────────────────────────┴──────────────────────────────────────────┘
```

---

## Step-by-Step: Your First Preview

### Step 1: Fill Metadata (Top Section)

```
┌──────────────┬──────────────┬──────────────┬──────────────────────┐
│ Buyer ID *   │ Buyer Name   │ Seller ID *  │ Seller Name          │
│ buyer-123    │ Acme Corp    │ seller-456   │ Widget Inc           │
└──────────────┴──────────────┴──────────────┴──────────────────────┘
┌──────────────┬──────────────┐
│ MMYY *       │ Version      │
│ 0125         │ 1            │
└──────────────┴──────────────┘
```

**What happens**: As you type, the suggested URL key auto-generates:
```
🔗 Suggested URL Key: acme-corp-widget-inc-0125-v1
```

### Step 2: Add JSON (Left Column)

**Option A: Upload File**
1. Click "📁 Upload File" button
2. Select `public/sample-landing-page.json`
3. Content auto-fills in textarea

**Option B: Paste JSON**
1. Copy your landing page JSON
2. Click in the large textarea
3. Paste (Ctrl+V / Cmd+V)

Example JSON structure:
```json
{
  "title": "My Landing Page",
  "hero": {
    "headline": "Welcome to Our Platform!",
    "subhead": "Join thousands of happy customers",
    "cta": {
      "text": "Start Free Trial",
      "href": "https://example.com/trial"
    }
  },
  "benefits": {
    "items": [
      {
        "title": "Fast",
        "body": "Lightning fast performance"
      }
    ]
  },
  "seller": {
    "name": "My Company",
    "about": "We make great products"
  }
}
```

### Step 3: Validate (Left Column)

Click the big blue button:
```
┌──────────────────────────────┐
│  ✅ Validate & Normalize     │
└──────────────────────────────┘
```

**What happens**:
1. JSON is parsed
2. Validation rules are checked
3. If valid: content is normalized
4. SHA-256 hash is calculated
5. Results appear below button

### Step 4: Review Validation (Left Column)

**Success Case**:
```
┌──────────────────────────────┐
│ ✅ Valid - Ready to Preview  │
│                              │
│ 🔐 Content SHA-256:          │
│ a1b2c3d4e5f6...              │
└──────────────────────────────┘
```

**Error Case**:
```
┌──────────────────────────────┐
│ ❌ Invalid - Fix Errors Below│
│                              │
│ ⛔ Errors (2):               │
│ ┌──────────────────────────┐ │
│ │ E-HERO-REQ               │ │
│ │ Missing required field   │ │
│ │ 📍 Field: hero.headline  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ E-URL-HTTPS              │ │
│ │ URL must use HTTPS       │ │
│ │ 📍 Field: hero.cta.href  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

**Warning Case** (still allows preview):
```
┌──────────────────────────────┐
│ ✅ Valid - Ready to Preview  │
│                              │
│ 🔐 Content SHA-256:          │
│ a1b2c3d4e5f6...              │
│                              │
│ ⚠️ Warnings (1):             │
│ ┌──────────────────────────┐ │
│ │ W-HERO-LONG              │ │
│ │ Headline is long (95)    │ │
│ │ 📍 Field: hero.headline  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### Step 5: View Preview (Right Column)

If validation succeeds, the preview automatically renders:

```
┌──────────────────────────────────────┐
│ 👁️ Live Preview                      │
├──────────────────────────────────────┤
│ ✨ Rendering normalized content      │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 🎯 HERO SECTION                │ │
│  │                                │ │
│  │ Welcome to Our Platform!       │ │
│  │ Join thousands of customers    │ │
│  │                                │ │
│  │ [ Start Free Trial → ]         │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ ✨ BENEFITS                    │ │
│  │                                │ │
│  │  ✓ Fast          ✓ Secure     │ │
│  │  Lightning fast  Bank-level    │ │
│  │  performance     security      │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 💰 PRICING OPTIONS             │ │
│  │                                │ │
│  │ [Starter] [Pro] [Enterprise]  │ │
│  │  $9/mo    $29/mo   Custom     │ │
│  └────────────────────────────────┘ │
│                                      │
│  ... (more sections) ...            │
│                                      │
└──────────────────────────────────────┘
```

### Step 6: Review Quick Stats (Below Preview)

```
┌────────────────┬─────────────────────────┐
│ Page Title     │ CTA Text                │
│ My Landing Pg  │ Start Free Trial        │
└────────────────┴─────────────────────────┘
```

---

## Common Scenarios

### Scenario 1: Testing Sample Data

1. Click "📁 Upload File"
2. Select `public/sample-landing-page.json`
3. Fill metadata:
   - Buyer ID: `buyer-123`
   - Seller ID: `seller-456`
   - MMYY: `0125`
4. Click "✅ Validate & Normalize"
5. See full preview with all 8 sections

**Expected Result**:
```
✅ Valid - Ready to Preview
🔗 Suggested URL: buyer-123-seller-456-0125-v1
🔐 Content SHA: (64-char hash)
👁️ Preview: 8 sections rendered
```

### Scenario 2: Fixing Validation Errors

**Problem**: You see errors after validation

**Solution**:
1. Read error message carefully
2. Note the field reference (📍 Field: ...)
3. Edit JSON in textarea
4. Click "✅ Validate & Normalize" again
5. Repeat until valid

**Example Error Fix**:
```
Before (Error):
{
  "hero": {
    "cta": {
      "text": "Click Here",
      "href": "http://example.com"  ← HTTP (not HTTPS)
    }
  }
}

❌ E-URL-HTTPS: URL must use HTTPS protocol
📍 Field: hero.cta.href

After (Fixed):
{
  "hero": {
    "cta": {
      "text": "Click Here",
      "href": "https://example.com"  ← Changed to HTTPS
    }
  }
}

✅ Valid - Ready to Preview
```

### Scenario 3: Handling Warnings

**Situation**: Validation succeeds but shows warnings

**What it means**:
- Content normalized successfully
- Preview will render
- Warning is advisory (not blocking)
- Content may have been auto-adjusted

**Example**:
```
✅ Valid - Ready to Preview

⚠️ W-CONTRAST: Text color adjusted for WCAG compliance
📍 Field: hero.headline

What happened: System detected low contrast ratio and 
automatically adjusted text color to meet WCAG 4.5:1 minimum.
```

**Action**: Preview renders with adjusted colors (no action needed)

### Scenario 4: Starting Fresh

**Want to test a new landing page?**

1. Click "🗑️ Clear All" button (top right)
2. All fields reset:
   - JSON textarea cleared
   - Metadata fields cleared
   - Validation results cleared
   - Preview cleared
3. Start over from Step 1

---

## Understanding the Outputs

### 1. Content SHA-256

```
🔐 Content SHA-256: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**What it is**: Unique fingerprint of your normalized content

**Why it matters**:
- **Deduplication**: Identical content gets same hash
- **Part B**: Used to prevent duplicate pages in database
- **Deterministic**: Same content always produces same hash

**Example Use Case**:
```typescript
// Check if content already exists before saving
const existingPage = await db
  .from('landing_pages')
  .select()
  .eq('content_sha', contentSha)
  .single();

if (existingPage) {
  console.log('This exact content already exists!');
}
```

### 2. Suggested URL Key

```
🔗 Suggested URL Key: acme-corp-widget-inc-0125-v1
```

**What it is**: Auto-generated URL slug for your landing page

**Format**: `buyer-seller-mmyy-vN`
- `acme-corp` - Buyer name (slugified)
- `widget-inc` - Seller name (slugified)
- `0125` - January 2025
- `v1` - Version 1

**Why it matters**:
- **SEO**: Clean, readable URLs
- **Part B**: Used for dynamic routing: `/preview/acme-corp-widget-inc-0125-v1`
- **Unique**: Combination ensures uniqueness

**Pattern**: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Only lowercase letters, numbers, hyphens
- No special characters
- No spaces

### 3. Validation Status

```
✅ Valid - Ready to Preview
```

**What it means**:
- All required fields present
- URLs are HTTPS
- Text within length limits
- Ready for database storage
- Preview can render

**Invalid Example**:
```
❌ Invalid - Fix Errors Below
```

**What it means**:
- Missing required fields, OR
- Invalid URLs, OR
- Text exceeds limits
- Preview blocked until fixed

---

## Error Code Quick Reference

### Most Common Errors

| Code | Meaning | Fix |
|------|---------|-----|
| `E-JSON-PARSE` | Invalid JSON syntax | Check for missing commas, quotes, brackets |
| `E-HERO-REQ` | Missing hero headline or CTA | Add `hero.headline` and `hero.cta` |
| `E-URL-HTTPS` | HTTP URL used (not HTTPS) | Change `http://` to `https://` |
| `E-TEXT-LIMIT` | Text too long | Shorten text (see field reference) |
| `E-MIN-SECTION` | Only 1 section provided | Add at least 1 more section (benefits, options, etc.) |

### Warning Codes

| Code | Meaning | Action |
|------|---------|--------|
| `W-HERO-LONG` | Headline > 90 chars | Consider shortening (soft cap) |
| `W-SUBHEAD-LONG` | Subhead > 220 chars | Consider shortening (soft cap) |
| `W-CONTRAST` | Low contrast ratio | Auto-adjusted to WCAG AA |

---

## Tips & Tricks

### 💡 Tip 1: Use Sample JSON First
Start with `public/sample-landing-page.json` to see a complete example.

### 💡 Tip 2: Fill Metadata First
Fill buyer/seller/mmyy BEFORE validating to see the suggested URL immediately.

### 💡 Tip 3: Check Field References
Error messages include `📍 Field: ...` - this tells you exactly where the problem is.

### 💡 Tip 4: HTTPS Only
All URLs MUST use HTTPS. This includes:
- `hero.cta.href`
- `hero.video_url`
- `options[].cta.href`
- `social[].url`
- `seller.cta_primary.href`
- `footer.logo_url`

### 💡 Tip 5: Text Length Caps

| Field | Soft Cap | Hard Limit |
|-------|----------|------------|
| Headline | 90 | 108 |
| Subhead | 220 | 264 |
| Benefit body | 400 | 480 |
| Quote | 300 | 360 |

Soft cap = warning, Hard limit = error

### 💡 Tip 6: Minimum 2 Sections
Always include:
1. Hero section (required)
2. At least 1 more section (benefits, options, seller, etc.)

### 💡 Tip 7: Empty Sections Auto-Skip
You can include all 8 sections in JSON, but only the ones with content will render. No visual gaps!

---

## Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Paste JSON | `Ctrl+V` | `Cmd+V` |
| Select All | `Ctrl+A` | `Cmd+A` |
| Copy SHA | `Ctrl+C` (select first) | `Cmd+C` |
| Tab to next field | `Tab` | `Tab` |
| Validate | `Enter` (button focused) | `Enter` |

---

## What's Next?

After you validate successfully:

### ✅ Part A (Complete)
- You see the preview
- You have the content_sha
- You have the page_url_key
- Content is normalized

### ⏭️ Part B (Future)
- Save to database with content_sha
- Create dynamic route `/preview/[slug]`
- Add authentication
- Publish workflow
- Analytics

---

## Need Help?

### Check Documentation
- **PART_A_COMPLETE.md** - Full project summary
- **PHASE_5_SUMMARY.md** - Studio details
- **PHASE_2_QUICK_REFERENCE.md** - All error codes

### Test Pages
- `/test-phase1` - Test normalization
- `/test-phase2` - Test validation
- `/test-phase3` - Test utilities
- `/test-phase4` - Test components

### Common Issues
1. **Preview not showing** → Check validation passed (green badge)
2. **Errors unclear** → Read field reference (📍)
3. **File upload failed** → Use `.json` file, valid JSON
4. **Slug not generating** → Fill buyer ID, seller ID, MMYY

---

**Happy landing page building!** 🚀

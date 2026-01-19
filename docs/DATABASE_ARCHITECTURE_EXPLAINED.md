# 🗄️ Database Architecture - Complete Visual Guide

> **For:** Understanding how the multi-tenant landing page system works  
> **Goal:** Clear explanation of page_url_key, database structure, and data flow

---

## 📚 Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [Database Table Structure](#2-database-table-structure)
3. [What is page_url_key?](#3-what-is-page_url_key)
4. [Complete Data Flow](#4-complete-data-flow)
5. [Real Examples](#5-real-examples)
6. [How URLs Work](#6-how-urls-work)
7. [Publishing Flow Step-by-Step](#7-publishing-flow-step-by-step)
8. [Quick Reference](#8-quick-reference)

---

## 1) The Big Picture

### 🎯 **What You're Building**

A **multi-tenant landing page platform** where:
- YOU (seller) create personalized landing pages for BUYERS
- Each buyer gets their own content
- All stored in ONE database table
- All rendered by ONE Next.js app
- Each page has a unique identifier: `page_url_key`

### 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR SYSTEM                               │
│                                                                  │
│  1. Studio (Web UI)        ← Where you create pages             │
│     └─> Paste JSON                                              │
│     └─> Click Publish                                           │
│                                                                  │
│  2. Supabase Database      ← Where content is stored            │
│     └─> landing_pages table                                     │
│     └─> Each row = one landing page                             │
│                                                                  │
│  3. Next.js App (Vercel)   ← What renders the pages            │
│     └─> /p/[slug] route                                         │
│     └─> Reads from database                                     │
│     └─> Shows buyer's page                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2) Database Table Structure

### 📊 **The `landing_pages` Table**

Think of this table as a **spreadsheet where each row is a landing page**:

```
landing_pages table in Supabase:

┌────┬────────────────────┬───────────┬────────────┬────────────┬──────────────────────────────┬─────────────┬────────────┐
│ id │ page_url_key       │ buyer_id  │ seller_id  │ status     │ page_content                 │ content_sha │ published_at│
├────┼────────────────────┼───────────┼────────────┼────────────┼──────────────────────────────┼─────────────┼────────────┤
│ 1  │ adient-cyngn-1025  │ adient    │ cyngn      │ published  │ {normalized: {...}}          │ abc123...   │ 2026-01-15 │
│ 2  │ microsoft-cyngn-01 │ microsoft │ cyngn      │ published  │ {normalized: {...}}          │ def456...   │ 2026-01-16 │
│ 3  │ tesla-cyngn-0226   │ tesla     │ cyngn      │ published  │ {normalized: {...}}          │ ghi789...   │ 2026-01-17 │
│ 4  │ ford-cyngn-draft   │ ford      │ cyngn      │ draft      │ {normalized: {...}}          │ jkl012...   │ NULL       │
└────┴────────────────────┴───────────┴────────────┴────────────┴──────────────────────────────┴─────────────┴────────────┘
```

### 📝 **Column Explanations**

| Column | What It Is | Example | Purpose |
|--------|-----------|---------|---------|
| **id** | Auto-generated unique ID | `1`, `2`, `3` | Database internal identifier |
| **page_url_key** | URL-friendly unique slug | `adient-cyngn-1025` | Used in URL: `/p/adient-cyngn-1025` |
| **buyer_id** | Who you're selling to | `adient`, `microsoft` | Identifies the buyer/prospect |
| **seller_id** | Your company | `cyngn` | Identifies you (the seller) |
| **status** | Publication state | `draft`, `published`, `archived` | Controls visibility |
| **page_content** | The actual content | `{normalized: {...}}` | All text, images, colors, etc. |
| **content_sha** | Hash of content | `abc123...` | Detects if content changed |
| **published_at** | When published | `2026-01-15T...` | Timestamp of publishing |
| **buyer_name** | Full buyer name | `Adient Corporation` | Optional: Display name |
| **seller_name** | Your full name | `Cyngn Inc.` | Optional: Display name |
| **mmyy** | Month-Year code | `1025` | Optional: October 2025 |

---

## 3) What is `page_url_key`?

### 🔑 **Definition**

`page_url_key` is the **unique slug** that identifies each landing page.

Think of it like a **username** - each landing page needs a unique name.

### 📐 **Format Rules**

```
Pattern: buyer-seller-mmyy

Examples:
✅ adient-cyngn-1025
✅ microsoft-cyngn-0126
✅ tesla-cyngn-0226
✅ ford-cyngn-draft
✅ my-company-yourcompany-1125

Rules:
- Lowercase only
- Alphanumeric + hyphens
- No spaces, underscores, or special chars
- 3-100 characters
- Must be globally unique
```

### 🎯 **Purpose**

The `page_url_key` serves THREE critical functions:

#### 1. **URL Generation**
```
page_url_key: "adient-cyngn-1025"
       ↓
URL: yoursite.com/p/adient-cyngn-1025
       ↓
User visits this URL
       ↓
Database query: WHERE page_url_key = 'adient-cyngn-1025'
       ↓
Renders Adient's landing page
```

#### 2. **Database Lookup**
```typescript
// When someone visits /p/adient-cyngn-1025
const slug = "adient-cyngn-1025"; // Extracted from URL

// Database query
const page = await supabase
  .from('landing_pages')
  .select('*')
  .eq('page_url_key', slug)        // ← Uses page_url_key
  .eq('status', 'published')
  .single();
  
// Returns Adient's content
```

#### 3. **Cache Management**
```typescript
// Each page gets a unique cache tag
const cacheTag = `landing:${page_url_key}`;  // "landing:adient-cyngn-1025"

// When you republish, only that page's cache is cleared
await revalidateTag(`landing:adient-cyngn-1025`);
// ← Other pages (microsoft, tesla) remain cached
```

### 💡 **Why "Key"?**

It's called a "key" because it's the **PRIMARY IDENTIFIER** for finding a specific landing page.

```
page_url_key = "adient-cyngn-1025"
      ↓
   Think of it as:
      ↓
"The key to unlock Adient's landing page from the database"
```

---

## 4) Complete Data Flow

### 📊 **From Studio to Live Page**

```
STEP 1: You Create Content in Studio
─────────────────────────────────────
┌──────────────────────────────┐
│ Studio Form                  │
│ ──────────────────────────── │
│ Buyer: Adient                │
│ Seller: Cyngn                │
│ Date: October 2025 (1025)    │
│                              │
│ JSON Content:                │
│ {                            │
│   hero: {                    │
│     headline: "..."          │
│   },                         │
│   benefits: [...],           │
│   ...                        │
│ }                            │
│                              │
│ [Publish Button]             │
└──────────────────────────────┘
         ↓
         
STEP 2: System Generates page_url_key
──────────────────────────────────────
Algorithm:
1. Take buyer_id: "adient"
2. Take seller_id: "cyngn"
3. Take mmyy: "1025"
4. Combine: "adient-cyngn-1025"
5. Check if unique in database
6. If exists, append version: "adient-cyngn-1025-v2"

Result: page_url_key = "adient-cyngn-1025"
         ↓

STEP 3: Validate & Normalize Content
─────────────────────────────────────
┌─────────────────────────────────┐
│ Validation                      │
│ ─────────────────────────────── │
│ ✓ All required fields present   │
│ ✓ URLs are https://             │
│ ✓ Text within length limits     │
│ ✓ Colors are valid hex          │
│                                 │
│ Normalization                   │
│ ─────────────────────────────── │
│ ✓ Structure standardized        │
│ ✓ Empty sections removed        │
│ ✓ SHA-256 hash computed         │
└─────────────────────────────────┘
         ↓

STEP 4: Save to Database
────────────────────────
INSERT INTO landing_pages:
┌────────────────────┬───────────┐
│ page_url_key       │ adient-   │
│                    │ cyngn-1025│
│ buyer_id           │ adient    │
│ seller_id          │ cyngn     │
│ status             │ published │
│ page_content       │ {...}     │
│ content_sha        │ abc123... │
│ published_at       │ now()     │
└────────────────────┴───────────┘
         ↓

STEP 5: Invalidate Cache
─────────────────────────
POST /api/revalidate
{
  "slug": "adient-cyngn-1025"
}
↓
Clear cache tag: "landing:adient-cyngn-1025"
         ↓

STEP 6: Return Live URL
────────────────────────
✅ Success!

Live URL: https://yoursite.com/p/adient-cyngn-1025

         ↓

STEP 7: User Visits URL
───────────────────────
Browser: GET /p/adient-cyngn-1025
         ↓
Next.js extracts slug: "adient-cyngn-1025"
         ↓
Query database:
  WHERE page_url_key = 'adient-cyngn-1025'
  AND status = 'published'
         ↓
Fetch content from page_content column
         ↓
Render React components with that content
         ↓
User sees Adient's personalized landing page! 🎉
```

---

## 5) Real Examples

### 🎬 **Example 1: Publishing for Adient**

```javascript
// What you enter in Studio:
{
  buyer_id: "adient",
  seller_id: "cyngn",
  mmyy: "1025",
  content: {
    hero: {
      headline: "Adient: Revolutionize Your Manufacturing",
      subhead: "Autonomous vehicles for automotive seating production"
    },
    benefits: [...],
    // ... more content
  }
}

// What gets generated:
page_url_key: "adient-cyngn-1025"

// What gets saved to database:
{
  id: 1,
  page_url_key: "adient-cyngn-1025",  // ← THE KEY!
  buyer_id: "adient",
  seller_id: "cyngn",
  buyer_name: "Adient Corporation",
  seller_name: "Cyngn Inc.",
  mmyy: "1025",
  status: "published",
  page_content: {
    normalized: {
      hero: {
        headline: "Adient: Revolutionize Your Manufacturing",
        subhead: "Autonomous vehicles for automotive seating production"
      },
      benefits: [...],
      // ... fully validated content
    },
    original: { /* raw JSON you pasted */ }
  },
  content_sha: "7f3e8c92a1b4d5e6...",
  published_at: "2026-01-15T14:30:00Z",
  created_at: "2026-01-15T14:30:00Z",
  updated_at: "2026-01-15T14:30:00Z"
}

// What URL you get:
https://yoursite.com/p/adient-cyngn-1025

// How it's accessed:
1. User clicks: yoursite.com/p/adient-cyngn-1025
2. Next.js extracts: slug = "adient-cyngn-1025"
3. Database query: WHERE page_url_key = 'adient-cyngn-1025'
4. Returns: Row with id=1
5. Renders: Adient's landing page
```

### 🎬 **Example 2: Publishing for Microsoft**

```javascript
// What you enter:
{
  buyer_id: "microsoft",
  seller_id: "cyngn",
  mmyy: "0126",
  content: { /* Microsoft's content */ }
}

// Generated:
page_url_key: "microsoft-cyngn-0126"

// Saved to database:
{
  id: 2,
  page_url_key: "microsoft-cyngn-0126",  // ← DIFFERENT KEY!
  buyer_id: "microsoft",
  seller_id: "cyngn",
  status: "published",
  page_content: { /* Microsoft's content */ },
  // ...
}

// URL:
https://yoursite.com/p/microsoft-cyngn-0126
```

### 🎬 **Example 3: Two Pages for Same Buyer**

```javascript
// First page (October 2025):
page_url_key: "adient-cyngn-1025"
URL: /p/adient-cyngn-1025

// Second page (January 2026):
page_url_key: "adient-cyngn-0126"
URL: /p/adient-cyngn-0126

// Both can exist simultaneously!
// Different page_url_key = Different pages
```

---

## 6) How URLs Work

### 🌐 **Current System (Option A - Path-Based)**

```
Format: https://yoursite.com/p/{page_url_key}

Examples:
https://yoursite.com/p/adient-cyngn-1025
https://yoursite.com/p/microsoft-cyngn-0126
https://yoursite.com/p/tesla-cyngn-0226
```

**How it works:**
```
1. User visits: yoursite.com/p/adient-cyngn-1025
                                 └─────────────┘
                                  This is the [slug]

2. Next.js route: app/p/[slug]/page.tsx
   - [slug] is a dynamic parameter
   - It captures whatever comes after /p/

3. In the code:
   const slug = params.slug;  // "adient-cyngn-1025"

4. Database query:
   WHERE page_url_key = 'adient-cyngn-1025'
   
5. Returns Adient's content and renders it
```

### 🌐 **Future System (Option D - Subdomain-Based)**

```
Format: https://{buyer}.yoursite.com

Examples:
https://adient.yoursite.com
https://microsoft.yoursite.com
https://tesla.yoursite.com
```

**How it will work:**
```
1. User visits: adient.yoursite.com

2. Middleware extracts subdomain:
   hostname: "adient.yoursite.com"
   subdomain: "adient"

3. Database query:
   WHERE subdomain = 'adient' AND status = 'published'
   
4. Returns Adient's content and renders it

Note: page_url_key still exists for backward compatibility!
```

---

## 7) Publishing Flow Step-by-Step

### 🔄 **Complete Publishing Sequence**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION: Click "Publish" in Studio                       │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. GENERATE page_url_key                                        │
│    - Input: buyer_id="adient", seller_id="cyngn", mmyy="1025"  │
│    - Output: page_url_key="adient-cyngn-1025"                  │
│    - Check uniqueness in database                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. VALIDATE Content                                             │
│    - All required fields present?                               │
│    - URLs valid (https only)?                                   │
│    - Text within length limits?                                 │
│    - Colors valid hex codes?                                    │
│    ✅ If valid, continue                                        │
│    ❌ If invalid, show errors and STOP                          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. NORMALIZE Content                                            │
│    - Standardize structure                                      │
│    - Remove empty sections                                      │
│    - Apply defaults                                             │
│    - Generate content_sha (hash)                                │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CHECK Idempotency                                            │
│    - Query: WHERE page_url_key = 'adient-cyngn-1025'           │
│    - If exists with SAME content_sha:                           │
│      → Return existing URL (no changes needed)                  │
│    - If different or doesn't exist:                             │
│      → Continue to save                                         │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. SAVE to Database (UPSERT)                                    │
│    INSERT INTO landing_pages                                    │
│    ON CONFLICT (page_url_key) DO UPDATE                         │
│    SET:                                                         │
│      page_url_key = 'adient-cyngn-1025'                        │
│      buyer_id = 'adient'                                        │
│      seller_id = 'cyngn'                                        │
│      status = 'published'                                       │
│      page_content = { normalized: {...}, original: {...} }      │
│      content_sha = 'abc123...'                                  │
│      published_at = NOW()                                       │
│      updated_at = NOW()                                         │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. INVALIDATE Cache                                             │
│    POST /api/revalidate                                         │
│    Headers: { x-revalidate-secret: "..." }                     │
│    Body: { slug: "adient-cyngn-1025" }                         │
│    ↓                                                            │
│    Clears cache tag: "landing:adient-cyngn-1025"               │
│    Next request will fetch fresh data from database             │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. RETURN Success                                               │
│    {                                                            │
│      ok: true,                                                  │
│      url: "https://yoursite.com/p/adient-cyngn-1025",          │
│      contentSha: "abc123...",                                   │
│      changed: true                                              │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. PAGE IS LIVE! 🎉                                             │
│    Users can now visit:                                         │
│    https://yoursite.com/p/adient-cyngn-1025                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8) Quick Reference

### 🎯 **Key Concepts Summary**

| Concept | Explanation | Example |
|---------|-------------|---------|
| **page_url_key** | Unique slug identifying each landing page | `adient-cyngn-1025` |
| **buyer_id** | Company you're selling to | `adient` |
| **seller_id** | Your company (always the same) | `cyngn` |
| **status** | Publication state | `draft`, `published`, `archived` |
| **page_content** | All the landing page content | `{normalized: {...}}` |
| **content_sha** | Hash to detect content changes | `abc123...` |
| **normalized** | Validated & structured content | Ready to render |
| **Upsert** | Insert or Update if exists | Prevents duplicates |

### 🔍 **Common Queries**

```sql
-- Find a specific page by slug
SELECT * FROM landing_pages 
WHERE page_url_key = 'adient-cyngn-1025'
AND status = 'published';

-- Find all pages for a buyer
SELECT * FROM landing_pages 
WHERE buyer_id = 'adient'
ORDER BY published_at DESC;

-- Find all published pages
SELECT page_url_key, buyer_id, published_at 
FROM landing_pages 
WHERE status = 'published'
ORDER BY published_at DESC;

-- Check if slug is available
SELECT EXISTS(
  SELECT 1 FROM landing_pages 
  WHERE page_url_key = 'new-slug-1025'
);
```

### 🗺️ **File Locations**

| What | Where |
|------|-------|
| Database types | `lib/db/supabase.ts` |
| Database queries | `lib/db/publishedLanding.ts` |
| Publish action | `lib/actions/publishLanding.ts` |
| Public route | `app/p/[slug]/page.tsx` |
| Validation | `lib/validate/publishMeta.ts` |
| Normalization | `lib/normalize/mapRawToNormalized.ts` |

### 📖 **Related Docs**

- [PART_A_Landing_Page_Implementation_Plan.md](PART_A_Landing_Page_Implementation_Plan.md) - Content validation
- [PART_B_Implementation_Plan_MultiTenant.md](PART_B_Implementation_Plan_MultiTenant.md) - Multi-tenant architecture
- [PART_D_Wildcard_Subdomains_Implementation.md](PART_D_Wildcard_Subdomains_Implementation.md) - Subdomain setup

---

## 🎓 **Mental Models**

### Model 1: Restaurant Menu Analogy

```
Database Table = Menu Board
├─ Each Row = One Menu Item
├─ page_url_key = Item Name (must be unique)
├─ page_content = Recipe/Ingredients
└─ status = "Available Today" or "Sold Out"

When customer orders "burger-deluxe":
1. Look up "burger-deluxe" on menu
2. Get the recipe
3. Make the burger
4. Serve it
```

### Model 2: Library Card Catalog

```
Database = Library Card Catalog
├─ Each Card = One Book
├─ page_url_key = Call Number (unique identifier)
├─ page_content = The actual book
└─ status = "Available" or "Checked Out"

When patron requests "adient-cyngn-1025":
1. Search catalog for "adient-cyngn-1025"
2. Locate the book
3. Retrieve it
4. Give to patron
```

### Model 3: Apartment Building

```
Database = Apartment Building
├─ Each Row = One Apartment Unit
├─ page_url_key = Apartment Number (e.g., "301")
├─ page_content = Interior of apartment
└─ status = "Occupied" (published) or "Vacant" (draft)

When visitor comes to "301":
1. Check directory for apartment "301"
2. Find which apartment it is
3. Open that door
4. Show the interior
```

---

## ❓ FAQ

### Q: Why not just use `id` instead of `page_url_key`?

**A:** URLs with IDs look ugly and expose internal details:
```
❌ yoursite.com/p/1234
✅ yoursite.com/p/adient-cyngn-1025
```

`page_url_key` is:
- Human-readable
- SEO-friendly
- Contains meaningful info
- Doesn't expose database internals

### Q: Can I change `page_url_key` after publishing?

**A:** Technically yes, but NOT RECOMMENDED because:
- Old URLs will break (404)
- People may have bookmarked the old URL
- Analytics data tied to old slug

Instead: Create a new page with new slug.

### Q: What if two pages have same buyer_id?

**A:** That's fine! Use different `page_url_key`:
```
Page 1: adient-cyngn-1025  (October 2025 campaign)
Page 2: adient-cyngn-0126  (January 2026 campaign)
```

### Q: Is `page_url_key` case-sensitive?

**A:** No! Always stored as lowercase:
```
Input: "Adient-Cyngn-1025"
Stored: "adient-cyngn-1025"
```

### Q: Can I use custom formats for `page_url_key`?

**A:** Yes, as long as it matches the regex:
```
✅ my-custom-slug
✅ q4-2025-promo
✅ test-page-123
❌ My_Page (underscore not allowed)
❌ special#page (special char not allowed)
```

---

**Still confused? Check the visual diagrams above or ask specific questions!** 🚀

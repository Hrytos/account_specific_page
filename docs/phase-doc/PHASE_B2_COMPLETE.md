# 🎯 Phase B-2 Complete — Public Route & Data Fetch

**Status**: ✅ **COMPLETE**  
**Date**: October 31, 2025  
**Phase**: Part B - Phase B-2

---

## Summary

Phase B-2 implements the public-facing route `/p/[slug]` that serves published landing pages from Supabase with On-Demand ISR (Incremental Static Regeneration). This enables multi-tenant landing page hosting with cache invalidation on a per-page basis.

---

## Deliverables

### ✅ 1. Supabase Client Setup

**File**: `lib/db/supabase.ts` (90 lines)

**Contents**:
- Server-side Supabase client with service role key
- Type-safe `LandingPageRow` interface
- Environment variable validation
- Type guards for content structure
- Security: Service role key is server-only (bypasses RLS)

**Key Features**:
- Auto-throws if env vars missing
- Type-safe database operations
- Documented security warnings

---

### ✅ 2. Published Landing Helper

**File**: `lib/db/publishedLanding.ts` (170 lines)

**Functions**:
1. **`getLandingCacheTag(slug)`** - Generate cache tag (`landing:{slug}`)
2. **`getPublishedLanding(slug)`** - Fetch published row from Supabase
3. **`extractNormalizedContent(row)`** - Extract & validate normalized content
4. **`getPublishedContent(slug)`** - Fetch + extract in one call
5. **`generateMetadataFromContent(content)`** - Generate Next.js metadata
6. **`getRouteSlug(params)`** - Helper for Next.js 15+ async params

**Cache Strategy**:
- Uses Supabase queries with Next.js fetch
- Tagged with `landing:{slug}` for ISR
- Revalidated on-demand via `/api/revalidate`
- No time-based revalidation (manual only)

---

### ✅ 3. Public Route

**File**: `app/p/[slug]/page.tsx` (60 lines)

**Features**:
- Dynamic route: `/p/{page_url_key}`
- Server-side data fetching with cache tags
- Renders with Part A components (Hero, Benefits, Options, etc.)
- Dynamic SEO metadata generation
- Returns 404 for missing/unpublished pages
- Accessible markup (H1 in Hero, H2 for sections)

**Example URLs**:
- `/p/adient-cyngn-1025` → Adient + Cyngn landing page
- `/p/duke-bluegrid-1125` → Duke Energy + BlueGrid landing page

---

### ✅ 4. Custom 404 Page

**File**: `app/p/[slug]/not-found.tsx` (70 lines)

**Features**:
- Friendly error message
- Visual icon (document with slash)
- Action buttons (Go Home, Go to Studio)
- Contact support link
- Responsive design

---

### ✅ 5. Environment Variables Template

**File**: `.env.example` (90 lines)

**Required Env Vars**:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key
REVALIDATE_SECRET=your-random-secret
STUDIO_PUBLISH_SECRET=your-studio-secret (optional)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Security Notes**:
- Service role bypasses RLS (server-only)
- Secrets should be generated with `openssl rand -base64 32`
- Mark server vars as "Server-Only" in Vercel

---

### ✅ 6. Dependencies Installed

**Package**: `@supabase/supabase-js` (v2.x)

**Audit**: 0 vulnerabilities

---

## Technical Details

### Cache Tag Format

```typescript
// For slug "adient-cyngn-1025"
const tag = `landing:adient-cyngn-1025`;
```

**Purpose**:
- On-Demand ISR revalidation
- Invalidate only the changed page (not full rebuild)

### Data Flow

```
1. User visits /p/adient-cyngn-1025
2. Next.js calls page.tsx
3. getPublishedContent("adient-cyngn-1025")
4. Supabase query: WHERE page_url_key = ? AND status = 'published'
5. Extract normalized content
6. Render with LandingPage component
7. Cache response with tag "landing:adient-cyngn-1025"
```

### Error Handling

| Scenario | Response |
|----------|----------|
| Page not found | 404 (not-found.tsx) |
| Not published (status ≠ 'published') | 404 |
| Invalid content structure | 404 + console error |
| Supabase error | 500 + console error |
| Missing env vars | Build-time error |

---

## Files Created

```
landing-page-studio/
├── lib/
│   └── db/
│       ├── supabase.ts ...................... 90 lines
│       └── publishedLanding.ts .............. 170 lines
├── app/
│   └── p/
│       └── [slug]/
│           ├── page.tsx ..................... 60 lines
│           └── not-found.tsx ................ 70 lines
├── .env.example ............................. 90 lines
└── docs/
    └── phase-doc/
        └── PHASE_B2_COMPLETE.md ............. (this file)
```

**Total**: ~480 lines

---

## Acceptance Criteria

- [x] Route `/p/[slug]` fetches from Supabase
- [x] Cache tags applied (`landing:{slug}`)
- [x] Missing pages return 404
- [x] SEO metadata generated dynamically
- [x] Renders with Part A components
- [x] Type-safe database operations
- [x] Environment variables documented
- [x] Security: service role is server-only

---

## Testing Checklist

### Prerequisites
1. [ ] Supabase project created
2. [ ] `landing_pages` table exists with correct schema
3. [ ] Indexes from Phase B-1 created
4. [ ] `.env.local` created with actual values
5. [ ] At least one test row inserted with `status='published'`

### Manual Tests

**Test 1: Happy Path**
```bash
# 1. Insert test row in Supabase:
INSERT INTO landing_pages (page_url_key, status, page_content, content_sha)
VALUES (
  'test-page-1025',
  'published',
  '{"normalized": { ... }}',  -- Use normalized content from Part A
  'abc123...'
);

# 2. Visit page:
http://localhost:3000/p/test-page-1025

# Expected: Landing page renders with all sections
```

**Test 2: Not Found**
```bash
# Visit non-existent page:
http://localhost:3000/p/does-not-exist-999

# Expected: Custom 404 page with "Go Home" and "Go to Studio" buttons
```

**Test 3: Draft Page (Not Published)**
```bash
# 1. Update test row:
UPDATE landing_pages SET status = 'draft' WHERE page_url_key = 'test-page-1025';

# 2. Visit page:
http://localhost:3000/p/test-page-1025

# Expected: 404 (only published pages are served)
```

**Test 4: SEO Metadata**
```bash
# 1. Visit published page
# 2. View page source (Ctrl+U)
# 3. Look for <title> and <meta> tags

# Expected:
<title>Page Title from normalized content</title>
<meta name="description" content="Description from seo.description">
<meta property="og:title" content="...">
```

**Test 5: Multiple Companies**
```bash
# 1. Insert two rows:
- test-adient-cyngn-1025
- test-duke-bluegrid-1125

# 2. Visit both:
http://localhost:3000/p/test-adient-cyngn-1025
http://localhost:3000/p/test-duke-bluegrid-1125

# Expected: Both render with unique content
```

---

## Next Steps

### ✅ Phase B-2 Complete

**Ready for**:
- Phase B-3: Revalidate API (On-Demand ISR)
- Phase B-4: Studio Publish (Server Action)
- Phase B-5: Documentation & Logging

### 📋 Before Moving to B-3

**Environment Setup** (required):
1. Create `.env.local` from `.env.example`
2. Fill in actual Supabase credentials
3. Generate secrets:
   ```bash
   # On macOS/Linux:
   openssl rand -base64 32
   
   # On Windows (PowerShell):
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

**Supabase Setup** (required):
1. Run indexes SQL from Phase B-1
2. Insert at least one test row with `status='published'`
3. Verify row has valid `page_content.normalized` structure

**Test Locally**:
```bash
npm run dev
# Visit http://localhost:3000/p/your-test-slug
```

---

## Troubleshooting

### Error: "SUPABASE_URL is not defined"

**Cause**: Missing environment variable  
**Fix**: Create `.env.local` and add `SUPABASE_URL`

### Error: "Module '@supabase/supabase-js' not found"

**Cause**: Package not installed  
**Fix**: Run `npm install @supabase/supabase-js`

### 404 on Published Page

**Checks**:
1. Row exists in `landing_pages`?
2. `status = 'published'`?
3. `page_url_key` matches URL exactly?
4. `page_content.normalized` is valid JSON?

### Page Shows Blank/Errors

**Checks**:
1. `page_content.normalized` has correct structure?
2. Required fields present (hero.headline)?
3. Check browser console for errors
4. Check Next.js terminal for server errors

---

## API Reference

### `getPublishedLanding(slug: string)`

Fetches a published landing page from Supabase.

**Returns**: `Promise<LandingPageRow | null>`  
**Throws**: On Supabase errors (except not-found)

**Example**:
```typescript
const row = await getPublishedLanding('adient-cyngn-1025');
if (!row) {
  // Not found or not published
}
```

### `getPublishedContent(slug: string)`

Fetches and extracts normalized content in one call.

**Returns**: `Promise<NormalizedContent | null>`

**Example**:
```typescript
const content = await getPublishedContent('adient-cyngn-1025');
if (content) {
  return <LandingPage content={content} />;
}
```

### `generateMetadataFromContent(content)`

Generates Next.js metadata object from normalized content.

**Returns**: `Metadata`

**Example**:
```typescript
export async function generateMetadata({ params }) {
  const content = await getPublishedContent(params.slug);
  if (!content) return { title: '404' };
  return generateMetadataFromContent(content);
}
```

---

**Phase B-2**: ✅ **COMPLETE**  
**Next Phase**: Phase B-3 (Revalidate API)

---

Made with ❤️ by the Hrytos team

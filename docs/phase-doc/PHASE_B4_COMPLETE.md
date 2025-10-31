# Phase B-4 Complete: Studio Publish Server Action

**Date**: October 31, 2025  
**Status**: ✅ Complete  
**Phase**: Part B - Phase 4 (Publish & Go Live)

---

## Overview

Implemented one-click server-side publish functionality that validates, normalizes, stores landing pages in Supabase, and invalidates the cache for immediate live updates.

---

## Deliverables

### 1. SHA-256 Content Hashing (`lib/util/hash.ts`)
- **Lines**: ~60
- **Purpose**: Deterministic content hashing for idempotency checks
- **Key Functions**:
  - `computeContentSha(normalized)` - Creates SHA-256 hash from normalized content
  - `compareSha(sha1, sha2)` - Helper for hash comparison
- **Algorithm**: Stable JSON stringification → SHA-256 digest

### 2. Publish Metadata Validation (`lib/validate/publishMeta.ts`)
- **Lines**: ~140
- **Purpose**: Validate metadata required for publishing
- **Schema** (Zod):
  - `page_url_key`: Lowercase alphanumeric with hyphens (3-100 chars)
  - `buyer_id`: Required, alphanumeric with hyphens (1-50 chars)
  - `seller_id`: Required, alphanumeric with hyphens (1-50 chars)
  - `mmyy`: MMYY format (e.g., "1025" for October 2025)
  - `buyer_name`: Optional display name (max 100 chars)
  - `seller_name`: Optional display name (max 100 chars)
- **Key Functions**:
  - `validatePublishMeta(meta)` - Zod validation with detailed errors
  - `generateSlug(buyer_id, seller_id, mmyy)` - Auto-generate slug
  - `validateSlugFormat(...)` - Verify slug matches components

### 3. Publish Server Action (`lib/actions/publishLanding.ts`)
- **Lines**: ~320
- **Purpose**: Core publish logic with full validation and idempotency
- **Flow**:
  1. ✅ **Secret Validation** - Checks `STUDIO_PUBLISH_SECRET`
  2. ✅ **Metadata Validation** - Validates slug, buyer_id, seller_id, mmyy
  3. ✅ **Throttle Check** - Prevents rapid re-publishes (15s window)
  4. ✅ **Content Validation** - Uses Part A `validateAndNormalize()`
  5. ✅ **SHA Computation** - Creates deterministic hash
  6. ✅ **Idempotency Check** - Query existing row by slug + contentSha
  7. ✅ **Early Return** - If same SHA exists, return `changed: false`
  8. ✅ **Upsert** - Save to `landing_pages` with `status='published'`
  9. ✅ **Cache Revalidation** - POST to `/api/revalidate` endpoint
  10. ✅ **Success Response** - Return live URL, SHA, changed flag
- **Features**:
  - In-memory throttle (Map of slug → timestamp)
  - Comprehensive error handling
  - Structured logging at info/warn/error levels
  - Returns detailed validation errors to client
- **Return Type**: `PublishResult` with `ok`, `url`, `contentSha`, `changed`, `error`, `validationErrors`

### 4. Studio UI Integration (`app/(studio)/studio/page.tsx`)
- **Lines Added**: ~150
- **Purpose**: Add Publish button and result display to Studio
- **New Features**:
  - 🚀 **Publish Button** - Enabled when content is validated and metadata complete
  - 📡 **Publish Result Panel** - Shows success/error with live URL
  - 🔐 **Secret Prompt** - Asks for `STUDIO_PUBLISH_SECRET` (temporary UX)
  - ℹ️ **Idempotency Message** - Indicates when no changes were made
  - 🔗 **Live URL Link** - Direct link to published page in new tab
- **State Management**:
  - `publishing` - Loading state during publish
  - `publishResult` - Result of publish operation
- **User Flow**:
  1. Fill in metadata (buyer_id, seller_id, mmyy)
  2. Paste/upload JSON content
  3. Click "Validate & Normalize"
  4. Review errors/warnings
  5. Click "Publish to Live"
  6. Enter secret (prompted)
  7. View live URL and SHA

---

## Technical Details

### Idempotency Logic

```typescript
// Query existing row
const existingRow = await supabaseAdmin
  .from('landing_pages')
  .select('content_sha, published_at')
  .eq('page_url_key', slug)
  .eq('status', 'published')
  .maybeSingle();

// Compare SHA-256 hashes
if (existingRow && existingRow.content_sha === contentSha) {
  return { ok: true, url, contentSha, changed: false };
}
```

**Benefit**: Re-publishing identical content skips DB write and cache invalidation, saving resources and time.

### Throttle Mechanism

```typescript
const publishThrottle = new Map<string, number>();
const THROTTLE_WINDOW_MS = 15_000; // 15 seconds

function isThrottled(slug: string): boolean {
  const lastPublish = publishThrottle.get(slug);
  if (!lastPublish) return false;
  return (Date.now() - lastPublish) < THROTTLE_WINDOW_MS;
}
```

**Benefit**: Prevents accidental rapid re-publishes, reducing API load and potential race conditions.

### Database Upsert

```typescript
await supabaseAdmin
  .from('landing_pages')
  .upsert(
    {
      page_url_key: slug,
      status: 'published',
      page_content: { normalized },
      content_sha: contentSha,
      buyer_id, seller_id, mmyy,
      buyer_name, seller_name,
      published_at: new Date().toISOString(),
    },
    { onConflict: 'page_url_key' }
  );
```

**Behavior**: 
- If `page_url_key` exists → UPDATE all fields
- If `page_url_key` is new → INSERT new row
- Unique constraint enforced by Phase B-1 index

### Cache Invalidation

```typescript
await fetch(`${baseUrl}/api/revalidate`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-revalidate-secret': revalidateSecret,
  },
  body: JSON.stringify({ slug }),
});
```

**Result**: Next.js regenerates `/p/{slug}` page on next request with fresh DB data.

---

## Security

1. **Server Action** (`'use server'`) - Runs only on server, never exposed to client
2. **Secret Validation** - Requires `STUDIO_PUBLISH_SECRET` match
3. **Server-Side Environment Variables** - All secrets are server-only
4. **Supabase Service Role** - Uses admin client with full permissions
5. **Input Validation** - Zod schemas validate all inputs before processing

---

## Logging

Structured console logs at three levels:

### Info (Success)
```typescript
console.info('[publishLanding] Published successfully', {
  slug, contentSha, changed: true, duration
});
```

### Warn (Non-Critical Issues)
```typescript
console.warn('[publishLanding] Invalid metadata', { issues });
console.warn('[publishLanding] Throttled', { slug, remainingMs });
```

### Error (Failures)
```typescript
console.error('[publishLanding] Database upsert error', { slug, error });
console.error('[publishLanding] Unexpected error', { error, duration });
```

---

## Testing Scenarios

### 1. First Publish (Success)
- **Given**: Valid JSON + complete metadata
- **When**: Click Publish with correct secret
- **Then**: Returns `changed: true`, live URL, new contentSha

### 2. Re-Publish Same Content (Idempotency)
- **Given**: Previously published page with same JSON
- **When**: Click Publish again
- **Then**: Returns `changed: false`, same URL, same contentSha (no DB write)

### 3. Re-Publish Updated Content
- **Given**: Previously published page with different JSON
- **When**: Click Publish with changes
- **Then**: Returns `changed: true`, same URL, new contentSha

### 4. Invalid Secret
- **Given**: Wrong `STUDIO_PUBLISH_SECRET`
- **When**: Click Publish
- **Then**: Returns `ok: false, error: "Unauthorized: Invalid publish secret"`

### 5. Invalid Metadata
- **Given**: Missing buyer_id or invalid mmyy
- **When**: Click Publish
- **Then**: Returns `ok: false` with `validationErrors` array

### 6. Invalid Content
- **Given**: JSON fails Part A validation (missing hero headline)
- **When**: Click Publish
- **Then**: Returns `ok: false, error: "Content validation failed"` with errors

### 7. Throttle
- **Given**: Published same slug <15 seconds ago
- **When**: Click Publish again
- **Then**: Returns `ok: false, error: "Please wait N seconds..."`

---

## File Summary

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `lib/util/hash.ts` | SHA-256 content hashing | 60 | ✅ Complete |
| `lib/validate/publishMeta.ts` | Metadata validation (Zod) | 140 | ✅ Complete |
| `lib/actions/publishLanding.ts` | Server action for publish | 320 | ✅ Complete |
| `app/(studio)/studio/page.tsx` | UI integration (+150 lines) | 600 | ✅ Complete |

**Total New Code**: ~670 lines

---

## Environment Variables Required

All must be set in `.env.local` (local) and Vercel dashboard (production):

```bash
STUDIO_PUBLISH_SECRET=<secure-random-string>  # For publish authorization
REVALIDATE_SECRET=<secure-random-string>      # For cache invalidation
SUPABASE_URL=<project-url>                    # Database connection
SUPABASE_SERVICE_ROLE=<service-role-key>      # Admin access
NEXT_PUBLIC_SITE_URL=<base-url>               # For generating live URLs
```

---

## Next Steps

**Phase B-5**: Documentation and Logging
- Create `README_PART_B.md` with deployment guide
- Add environment variable documentation
- Include curl test examples
- Add troubleshooting section
- Implement structured logging (enhance existing console.log calls)
- Document rollback procedures

---

## Acceptance Criteria

✅ **All Met**:
- [x] Clicking Publish returns the live URL
- [x] Re-publishing same JSON is a no-op (idempotency)
- [x] Updated JSON reflects live within seconds (cache revalidation)
- [x] Server-side secret check prevents unauthorized access
- [x] Comprehensive validation with detailed errors
- [x] Throttle prevents rapid re-publishes (15s)
- [x] Structured logging for debugging
- [x] TypeScript type safety throughout

---

## Related Documentation

- `docs/URL_SCHEME.md` - URL scheme (Option A)
- `docs/phase-doc/PHASE_B2_COMPLETE.md` - Public route implementation
- `docs/phase-doc/PHASE_B3_COMPLETE.md` - Revalidate API
- `VERIFY_PART_B.md` - Verification guide

---

**Phase B-4 Status**: ✅ **COMPLETE**  
**Ready for**: Phase B-5 (Documentation & Logging)

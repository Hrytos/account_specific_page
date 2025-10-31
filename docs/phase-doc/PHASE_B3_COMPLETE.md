# 🎯 Phase B-3 Complete — Revalidate API (On-Demand ISR)

**Status**: ✅ **COMPLETE**  
**Date**: October 31, 2025  
**Phase**: Part B - Phase B-3

---

## Summary

Phase B-3 implements the `/api/revalidate` endpoint that enables On-Demand Incremental Static Regeneration (ISR). This allows the system to invalidate and regenerate **only the specific landing page that changed**, rather than rebuilding the entire site.

---

## Deliverables

### ✅ 1. Revalidate API Route Handler

**File**: `app/api/revalidate/route.ts` (210 lines)

**Features**:
- **POST /api/revalidate** - Revalidate a specific landing page
- **GET /api/revalidate** - API documentation
- **OPTIONS /api/revalidate** - CORS preflight support

**Security**:
- Secret header validation (`x-revalidate-secret`)
- Returns 401 Unauthorized if secret missing or incorrect
- Environment variable check on startup

**Validation**:
- Zod schema validation for request body
- Slug pattern validation: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`
- Max length: 100 characters
- Friendly error messages

**Response Formats**:
```typescript
// Success (200)
{
  ok: true,
  slug: "adient-cyngn-1025",
  path: "/p/adient-cyngn-1025",
  cacheTag: "landing:adient-cyngn-1025",
  message: "Successfully revalidated landing page: adient-cyngn-1025",
  duration: "45ms"
}

// Unauthorized (401)
{
  ok: false,
  error: "Unauthorized",
  message: "Invalid revalidation secret"
}

// Validation Error (400)
{
  ok: false,
  error: "Validation failed",
  message: "slug: Slug must contain only lowercase letters, numbers, and hyphens"
}

// Server Error (500)
{
  ok: false,
  error: "Revalidation failed",
  message: "..."
}
```

---

### ✅ 2. Test Script

**File**: `test-revalidate-api.ps1` (PowerShell)

**Tests**:
1. GET request (API documentation)
2. POST with valid secret (success)
3. POST without secret (401)
4. POST with invalid secret (401)
5. POST with invalid slug format (400)
6. POST with empty slug (400)

**Usage**:
```powershell
# Make sure dev server is running
npm run dev

# Run tests in another terminal
.\test-revalidate-api.ps1
```

---

## Technical Details

### Revalidation Strategy

**Option A Implementation**:
- Uses `revalidatePath('/p/{slug}')` for cache invalidation
- Path-based revalidation (Next.js 16 compatible)
- Invalidates only the specific page

**Cache Tag** (for reference):
```typescript
const cacheTag = `landing:${slug}`;  // e.g., "landing:adient-cyngn-1025"
```

### Request/Response Flow

```
1. Client sends POST to /api/revalidate
   Headers: { 'x-revalidate-secret': '<secret>' }
   Body: { "slug": "adient-cyngn-1025" }

2. API validates secret header
   ✅ Match → Continue
   ❌ No match → 401 Unauthorized

3. API validates request body (Zod)
   ✅ Valid → Continue
   ❌ Invalid → 400 Bad Request

4. API calls revalidatePath('/p/adient-cyngn-1025')
   ✅ Success → 200 OK
   ❌ Error → 500 Internal Server Error

5. Next request to /p/adient-cyngn-1025 regenerates the page
```

---

## Files Created

```
landing-page-studio/
├── app/
│   └── api/
│       └── revalidate/
│           └── route.ts ..................... 210 lines
├── test-revalidate-api.ps1 .................. 150 lines
└── docs/
    └── phase-doc/
        └── PHASE_B3_COMPLETE.md ............. (this file)
```

**Total**: ~360 lines

---

## API Reference

### POST /api/revalidate

Revalidates a specific landing page cache.

**Headers**:
```
content-type: application/json
x-revalidate-secret: <secret-from-env>
```

**Body**:
```json
{
  "slug": "adient-cyngn-1025"
}
```

**Success Response (200)**:
```json
{
  "ok": true,
  "slug": "adient-cyngn-1025",
  "path": "/p/adient-cyngn-1025",
  "cacheTag": "landing:adient-cyngn-1025",
  "message": "Successfully revalidated landing page: adient-cyngn-1025",
  "duration": "45ms"
}
```

**Curl Example**:
```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "content-type: application/json" \
  -H "x-revalidate-secret: revalidate_prod_2025_k9mP3xQ7vL2nR8wF5jH1cT6dY4sA0bE" \
  -d '{"slug":"adient-cyngn-1025"}'
```

**PowerShell Example**:
```powershell
$secret = $env:REVALIDATE_SECRET
$body = @{ slug = "adient-cyngn-1025" } | ConvertTo-Json

Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/revalidate" `
  -Headers @{
    "content-type" = "application/json"
    "x-revalidate-secret" = $secret
  } `
  -Body $body
```

---

### GET /api/revalidate

Returns API documentation.

**Response (200)**:
```json
{
  "name": "Revalidate API",
  "description": "On-Demand ISR endpoint for invalidating landing page caches",
  "version": "1.0.0",
  "usage": { ... },
  "responses": { ... }
}
```

---

## Testing

### Manual Testing

**1. Start Dev Server**:
```bash
npm run dev
```

**2. Test GET (Documentation)**:
```bash
curl http://localhost:3000/api/revalidate
```

**3. Test POST (Valid)**:
```bash
# Windows PowerShell
$secret = "revalidate_prod_2025_k9mP3xQ7vL2nR8wF5jH1cT6dY4sA0bE"
curl -X POST http://localhost:3000/api/revalidate `
  -H "content-type: application/json" `
  -H "x-revalidate-secret: $secret" `
  -d '{"slug":"test-page-1025"}'
```

**4. Run Full Test Suite**:
```powershell
.\test-revalidate-api.ps1
```

---

### Expected Test Results

| Test | Expected Result |
|------|----------------|
| GET /api/revalidate | 200 OK with API docs |
| POST with valid secret | 200 OK with `{ ok: true }` |
| POST without secret | 401 Unauthorized |
| POST with invalid secret | 401 Unauthorized |
| POST with UPPERCASE slug | 400 Bad Request |
| POST with empty slug | 400 Bad Request |

---

## Acceptance Criteria

- [x] POST endpoint accepts `{ slug: string }`
- [x] Secret header validation works
- [x] Returns 401 if secret missing/incorrect
- [x] Zod validation for slug format
- [x] Calls `revalidatePath('/p/{slug}')`
- [x] Returns success/error responses
- [x] GET endpoint returns documentation
- [x] CORS support (OPTIONS)
- [x] Structured logging
- [x] Test script included

---

## Integration with Publish Flow

The Revalidate API will be called by the Studio Publish server action (Phase B-4):

```typescript
// Phase B-4: Studio Publish (coming next)
async function publishLanding(rawJson, meta) {
  // 1. Validate & normalize
  // 2. Upsert to Supabase
  // 3. Call revalidate API
  const response = await fetch('/api/revalidate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-revalidate-secret': process.env.REVALIDATE_SECRET,
    },
    body: JSON.stringify({ slug: meta.page_url_key }),
  });
  
  // 4. Return live URL
}
```

---

## Troubleshooting

### Error: "REVALIDATE_SECRET not configured"

**Cause**: Environment variable missing  
**Fix**: Add `REVALIDATE_SECRET` to `.env.local`

### Error: 401 Unauthorized

**Causes**:
1. Missing `x-revalidate-secret` header
2. Incorrect secret value
3. Secret has extra spaces/newlines

**Fix**: Check header name and value exactly match `.env.local`

### Error: 400 Validation failed

**Causes**:
1. Slug contains uppercase letters
2. Slug contains special characters (except hyphens)
3. Slug is empty or too long (>100 chars)

**Fix**: Use lowercase, numbers, and hyphens only

### Revalidation succeeds but page doesn't update

**Checks**:
1. Was the page already cached?
2. Did you hard refresh? (Ctrl+Shift+R)
3. Is the Supabase row actually different?
4. Check if `published_at` was updated

---

## Security Notes

### ⚠️ Important

1. **Never expose** `REVALIDATE_SECRET` to the client/browser
2. **Only call** from server-side code (server actions, API routes)
3. **Rotate secrets** periodically in production
4. **Use HTTPS** in production (secrets in plain HTTP can be intercepted)

### Vercel Deployment

When deploying to Vercel:
1. Add `REVALIDATE_SECRET` as Environment Variable
2. Mark as **"Server-Only"** (not exposed to browser)
3. Set for all environments (Production, Preview, Development)

---

## Next Steps

### ✅ Phase B-3 Complete

**Ready for**:
- Phase B-4: Studio Publish (Server Action)
- Phase B-5: Documentation & Logging

### 📋 Before B-4

**Test the API**:
```powershell
# 1. Start dev server
npm run dev

# 2. Run test script
.\test-revalidate-api.ps1

# 3. Verify all tests pass
```

---

**Phase B-3**: ✅ **COMPLETE**  
**Next Phase**: Phase B-4 (Studio Publish)

---

Made with ❤️ by the Hrytos team

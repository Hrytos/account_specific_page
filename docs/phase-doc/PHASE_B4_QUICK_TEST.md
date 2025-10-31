# Phase B-4 Quick Test Guide

Quick reference for testing the Studio Publish functionality.

---

## Prerequisites

1. ✅ Dev server running: `npm run dev`
2. ✅ Environment variables set in `.env.local`
3. ✅ Database indexes created (Phase B-1)
4. ✅ Supabase table `landing_pages` exists

---

## Test Publish Flow

### 1. Open Studio
```
http://localhost:3000/studio
```

### 2. Fill Metadata
```
Buyer ID:     adient
Buyer Name:   Adient
Seller ID:    cyngn
Seller Name:  Cyngn
MMYY:         1025
Version:      1
```

**Suggested slug**: `adient-cyngn-1025`

### 3. Paste Sample JSON

Use the sample from `public/sample-landing-page.json`:

```json
{
  "title": "Adient × Cyngn — Autonomous Vehicle Partnership",
  "hero": {
    "headline": "Future of Automotive Seating",
    "subheadline": "Adient and Cyngn partner to deliver autonomous vehicle solutions",
    "cta": {
      "text": "Learn More",
      "url": "https://example.com/learn-more"
    }
  }
}
```

### 4. Validate Content

Click **"✅ Validate & Normalize"**

Expected:
- ✅ Green success banner
- Content SHA displayed
- Preview renders in right column

### 5. Publish

Click **"🚀 Publish to Live"**

When prompted for secret, enter your `STUDIO_PUBLISH_SECRET` from `.env.local`.

**Expected Result**:
```
✅ Published Successfully!

🔗 Live URL:
http://localhost:3000/p/adient-cyngn-1025

🔐 Content SHA-256:
a3f5c8e9d2b4f7a1c6e8d3b9f4a2c5e7d1b6f8a3c9e4d2b7f5a1c8e6d3b9f4a2
```

### 6. Visit Live Page

Click the live URL or navigate to:
```
http://localhost:3000/p/adient-cyngn-1025
```

Should see the rendered landing page with your content.

---

## Test Idempotency

### 1. Click Publish Again (Same Content)

Without changing anything, click **"🚀 Publish to Live"** again.

**Expected Result**:
```
✅ Already Published (No Changes)

ℹ️ The content is identical to the currently published version. No update was made.
```

### 2. Update Content

Change the hero headline:
```json
"headline": "Revolutionary Automotive Innovation"
```

Click **"✅ Validate & Normalize"** then **"🚀 Publish to Live"**

**Expected Result**:
```
✅ Published Successfully!

🔗 Live URL:
http://localhost:3000/p/adient-cyngn-1025
(same URL, new content SHA)
```

### 3. Verify Update

Visit the live URL and hard refresh (`Ctrl+Shift+R`).

Should see the new headline.

---

## Test Throttle

Click **"🚀 Publish to Live"** twice rapidly (within 15 seconds).

**Expected Result** (2nd click):
```
❌ Publish Failed

Please wait 13 seconds before publishing again
```

Wait 15 seconds and try again → Success.

---

## Test Validation Errors

### Invalid Metadata

Clear `MMYY` field and click Publish.

**Expected**:
```
❌ Publish Failed

Invalid publish metadata

Validation Errors:
📍 mmyy
Required
```

### Invalid Content

Remove the hero headline from JSON:
```json
{
  "title": "Test",
  "hero": {
    "subheadline": "Missing headline"
  }
}
```

Click Validate → Publish.

**Expected**:
```
❌ Publish Failed

Content validation failed

Validation Errors:
📍 hero.headline
Hero headline is required
```

---

## Test Secret Validation

Click Publish and enter **wrong secret**.

**Expected**:
```
❌ Publish Failed

Unauthorized: Invalid publish secret
```

---

## Verify Database

### Check Supabase Table

Go to Supabase Dashboard → Table Editor → `landing_pages`

Should see row:
```
page_url_key:  adient-cyngn-1025
status:        published
buyer_id:      adient
seller_id:     cyngn
mmyy:          1025
content_sha:   a3f5c8e9d...
published_at:  2025-10-31T12:34:56.789Z
```

### Check page_content Column

Click into the row → Expand `page_content` field.

Should see:
```json
{
  "normalized": {
    "title": "...",
    "hero": { ... },
    "benefits": [ ... ],
    ...
  }
}
```

---

## Check Server Logs

Look for structured logs in terminal:

### Success Log
```
[publishLanding] Published successfully {
  slug: 'adient-cyngn-1025',
  contentSha: 'a3f5c8e9d...',
  changed: true,
  duration: 245
}
```

### Idempotency Log
```
[publishLanding] Idempotent publish (no changes) {
  slug: 'adient-cyngn-1025',
  contentSha: 'a3f5c8e9d...',
  duration: 78
}
```

### Error Log
```
[publishLanding] Invalid metadata {
  issues: [
    { path: ['mmyy'], message: 'Required' }
  ]
}
```

---

## Troubleshooting

### ❌ "Server configuration error: STUDIO_PUBLISH_SECRET not set"

**Fix**: Add to `.env.local`:
```bash
STUDIO_PUBLISH_SECRET=your-secret-here-123456
```

Restart dev server.

### ❌ "Database error during idempotency check"

**Fix**: Check Supabase connection.
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` in `.env.local`
2. Test connection: Visit `http://localhost:3000/p/test-page` (should get 404, not 500)

### ❌ "Failed to save to database"

**Fix**: Check database indexes created.

Run in Supabase SQL Editor:
```sql
SELECT * FROM pg_indexes 
WHERE tablename = 'landing_pages';
```

Should see `landing_pages_page_url_key_uk` index.

### ❌ Revalidate API error (publish succeeds but warning)

**Fix**: Check `REVALIDATE_SECRET` matches in:
- `.env.local`
- Server action fetch call

Non-critical - page is published, just cache not invalidated.

### ❌ Publish button disabled

**Checklist**:
1. Is content validated? (Green success banner)
2. Are all required metadata fields filled? (Buyer ID, Seller ID, MMYY)
3. Is suggested slug showing?

---

## Success Criteria

✅ All tests pass:
- [x] First publish returns live URL
- [x] Re-publish same content shows "No Changes"
- [x] Updated content publishes with new SHA
- [x] Throttle prevents rapid publishes
- [x] Invalid metadata/content shows validation errors
- [x] Wrong secret returns unauthorized error
- [x] Database row created/updated correctly
- [x] Live page renders published content
- [x] Cache invalidation works (hard refresh shows updates)

---

**Phase B-4 Testing**: ✅ **COMPLETE**  
**Ready for**: Phase B-5 (Documentation)

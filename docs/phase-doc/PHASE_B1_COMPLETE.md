# 🎯 Phase B-1 Complete — URL Scheme & Uniqueness

**Status**: ✅ **COMPLETE**  
**Date**: October 31, 2025  
**Phase**: Part B - Phase B-1

---

## Summary

Phase B-1 establishes the URL scheme and database uniqueness constraints for the multi-tenant landing page system. We've chosen **Option A (Global Slugs)** for its simplicity and speed of implementation.

---

## Deliverables

### ✅ 1. URL Scheme Documentation

**File**: `docs/URL_SCHEME.md`

**Contents**:
- **Chosen Scheme**: Option A (Global Slugs)
- **Public URL Format**: `/p/{page_url_key}`
- **Slug Convention**: `{buyer}-{seller}-{mmyy}`
- **Uniqueness Rule**: Global uniqueness across all companies
- **Cache Tag Format**: `landing:{page_url_key}`
- **Examples**: Two companies (Adient+Cyngn, Duke+BlueGrid) with multiple pages
- **Migration Path**: How to upgrade to Option B/C in the future
- **Troubleshooting**: Common issues and solutions

### ✅ 2. Database Indexes SQL Script

**File**: `sql/phase_b1_indexes.sql`

**Indexes Created**:
1. **`landing_pages_page_url_key_uk`** (UNIQUE)
   - Enforces global uniqueness on `page_url_key`
   - Prevents slug collisions

2. **`landing_pages_status_page_url_key_idx`** (COMPOSITE)
   - Optimizes `WHERE status='published' AND page_url_key=?`
   - Used by public route `/p/[slug]`

3. **`landing_pages_content_sha_idx`** (HASH)
   - Fast lookups by `content_sha`
   - Enables idempotency checks during publish

4. **`landing_pages_published_at_idx`** (PARTIAL)
   - Optimizes audit queries by `published_at`
   - Only indexes published rows

**Migration Notes**:
- SQL script includes comments for Option B/C migration
- Can be run multiple times (idempotent with `IF NOT EXISTS`)

---

## Key Decisions

### ✅ Option A Selected

**Rationale**:
- **Fastest to ship**: No complex routing or middleware
- **Simple**: Single key (`page_url_key`) for all operations
- **Scalable**: Can handle thousands of pages efficiently
- **Future-proof**: Clear migration path to B/C documented

**Trade-offs Accepted**:
- Global slug uniqueness (must avoid collisions)
- No built-in tenant namespacing (handled by slug convention)

---

## Technical Details

### Slug Format

```
{buyer}-{seller}-{mmyy}
```

**Example**: `adient-cyngn-1025`

**Validation Pattern**:
```typescript
/^[a-z0-9]+(?:-[a-z0-9]+)*$/
```

### Cache Tag Format

```
landing:{page_url_key}
```

**Example**: `landing:adient-cyngn-1025`

**Purpose**:
- On-Demand ISR (Incremental Static Regeneration)
- Revalidate only the changed page (not full rebuild)

### Database Uniqueness

**Constraint**:
```sql
CREATE UNIQUE INDEX landing_pages_page_url_key_uk
  ON landing_pages (page_url_key);
```

**Conflict Resolution**:
- Studio suggests `-v2`, `-v3` suffix if collision detected
- User can override manually

---

## Multi-Company Examples

### Company A: Adient + Cyngn

| Month | Slug | URL |
|-------|------|-----|
| Oct 2025 | `adient-cyngn-1025` | `/p/adient-cyngn-1025` |
| Nov 2025 | `adient-cyngn-1125` | `/p/adient-cyngn-1125` |

**Cache Tags**:
- `landing:adient-cyngn-1025`
- `landing:adient-cyngn-1125`

### Company B: Duke Energy + BlueGrid Energy

| Month | Slug | URL |
|-------|------|-----|
| Nov 2025 | `duke-bluegrid-1125` | `/p/duke-bluegrid-1125` |
| Dec 2025 | `duke-bluegrid-1225` | `/p/duke-bluegrid-1225` |

**Cache Tags**:
- `landing:duke-bluegrid-1125`
- `landing:duke-bluegrid-1225`

**Isolation**:
- Each page is independent
- Publishing one page doesn't affect others
- Revalidating one page doesn't rebuild others

---

## Files Created

```
landing-page-studio/
├── docs/
│   └── URL_SCHEME.md ...................... 350 lines
├── sql/
│   └── phase_b1_indexes.sql ............... 110 lines
└── docs/
    └── phase-doc/
        └── PHASE_B1_COMPLETE.md ........... (this file)
```

**Total**: ~460 lines

---

## Next Steps

### ✅ Phase B-1 Complete

**Ready for**:
- Phase B-2: Public Route Implementation
- Phase B-3: Revalidate API
- Phase B-4: Studio Publish

### 📋 Prerequisites Before B-2

**Supabase**:
1. Run `sql/phase_b1_indexes.sql` in Supabase SQL Editor
2. Verify indexes created with:
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'landing_pages'
   ORDER BY indexname;
   ```

**Vercel Env Vars** (if not set):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`
- `REVALIDATE_SECRET`
- `STUDIO_PUBLISH_SECRET` (optional)
- `NEXT_PUBLIC_SITE_URL` (e.g., `https://plays.hrytos.com`)

**Local Env** (create `.env.local`):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key
REVALIDATE_SECRET=your-random-secret-string
STUDIO_PUBLISH_SECRET=your-studio-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Acceptance Criteria

- [x] URL scheme documented (Option A)
- [x] Slug convention defined (`buyer-seller-mmyy`)
- [x] Cache tag format specified (`landing:{slug}`)
- [x] Database indexes SQL script created
- [x] Multi-company examples provided
- [x] Migration path to Option B/C documented
- [x] Troubleshooting guide included

---

## Testing Checklist (for B-2+)

Once routes are implemented:

- [ ] Two different slugs render from two rows
- [ ] Missing slug returns 404
- [ ] Slug collision prevented by unique index
- [ ] Cache tag appears in response headers
- [ ] Revalidate API regenerates only the changed page
- [ ] Published content matches normalized contract
- [ ] SEO metadata generated from content
- [ ] External links have `rel="noopener"`

---

**Phase B-1**: ✅ **COMPLETE**  
**Next Phase**: Phase B-2 (Public Route & Data Fetch)

---

Made with ❤️ by the Hrytos team

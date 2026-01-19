# PART D — Wildcard Subdomains Implementation Plan

> **Goal:** Enable personalized subdomains for each buyer on the seller's domain  
> **Example:** `adient.yourcompany.com`, `microsoft.yourcompany.com`  
> **Timeline:** 1-2 days for full implementation  
> **Prerequisites:** Vercel Pro plan ($20/month), Domain ownership

---

## 📋 Table of Contents

1. [Current State](#1-current-state)
2. [Desired State](#2-desired-state)
3. [Architecture Changes](#3-architecture-changes)
4. [Database Schema Updates](#4-database-schema-updates)
5. [Code Implementation](#5-code-implementation)
6. [Vercel Configuration](#6-vercel-configuration)
7. [DNS Setup](#7-dns-setup)
8. [Testing Plan](#8-testing-plan)
9. [Deployment Checklist](#9-deployment-checklist)
10. [Rollback Plan](#10-rollback-plan)

---

## 1) Current State

### What We Have
- ✅ Multi-tenant architecture with Supabase
- ✅ Path-based routing: `/p/[slug]`
- ✅ Dynamic content per buyer
- ✅ Studio for publishing
- ✅ On-Demand ISR with cache tags

### Current URLs
```
https://yoursite.com/p/adient-cyngn-1025
https://yoursite.com/p/microsoft-cyngn-0126
https://yoursite.com/p/tesla-cyngn-0226
```

### Pain Points
- URLs look generic and technical
- Not personalized for buyers
- Slug format is not user-friendly

---

## 2) Desired State

### Target URLs
```
https://adient.yourcompany.com    ← Personalized for Adient
https://microsoft.yourcompany.com ← Personalized for Microsoft
https://tesla.yourcompany.com     ← Personalized for Tesla
```

### Benefits
- ✅ Professional, branded URLs
- ✅ Personalized experience per buyer
- ✅ Easier to communicate (shorter, cleaner)
- ✅ Better for sales/marketing
- ✅ Maintains single codebase

### Backward Compatibility
- Old URLs (`/p/[slug]`) still work
- Gradual migration possible
- Both URL formats supported simultaneously

---

## 3) Architecture Changes

### Request Flow (New)

```
┌─────────────────────────────────────────────────────────────┐
│ User visits: adient.yourcompany.com                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ DNS (Wildcard): *.yourcompany.com → cname.vercel-dns.com   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Vercel receives request                                      │
│ Host header: adient.yourcompany.com                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ middleware.ts intercepts                                     │
│ - Extracts subdomain: "adient"                              │
│ - Checks if custom subdomain request                        │
│ - Rewrites internally to: /p/[dynamic]                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ app/p/[slug]/page.tsx                                       │
│ - Receives subdomain via searchParams                       │
│ - Queries DB: WHERE subdomain = 'adient'                    │
│ - Renders content                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Response sent to user                                        │
│ URL in browser: adient.yourcompany.com                      │
└─────────────────────────────────────────────────────────────┘
```

### Routing Priorities

```
Priority 1: Subdomain lookup
  - If host = "adient.yourcompany.com"
  - Extract subdomain = "adient"
  - Query: WHERE subdomain = 'adient' AND status = 'published'
  
Priority 2: Slug-based lookup (backward compatibility)
  - If path = "/p/adient-cyngn-1025"
  - Query: WHERE page_url_key = 'adient-cyngn-1025' AND status = 'published'
  
Priority 3: 404
  - No match found
```

---

## 4) Database Schema Updates

### Add Subdomain Column

```sql
-- Add subdomain column to landing_pages table
ALTER TABLE landing_pages 
ADD COLUMN subdomain TEXT;

-- Add unique constraint for published subdomains
CREATE UNIQUE INDEX idx_landing_pages_subdomain_published 
ON landing_pages(subdomain) 
WHERE status = 'published' AND subdomain IS NOT NULL;

-- Add regular index for fast lookups
CREATE INDEX idx_landing_pages_subdomain 
ON landing_pages(subdomain) 
WHERE subdomain IS NOT NULL;

-- Optional: Add index for combined lookup
CREATE INDEX idx_landing_pages_subdomain_status 
ON landing_pages(subdomain, status);
```

### Migration Notes
- `subdomain` is OPTIONAL (NULL allowed for backward compatibility)
- Existing pages continue to work via `page_url_key`
- New pages can have both `subdomain` and `page_url_key`
- `subdomain` must be unique per published page

### Subdomain Validation Rules
```typescript
// Subdomain rules:
// - Lowercase alphanumeric + hyphens only
// - 3-63 characters
// - Cannot start/end with hyphen
// - Reserved words blocked: www, api, admin, app, etc.

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;

const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'app', 'dashboard', 'studio',
  'staging', 'dev', 'test', 'mail', 'ftp', 'cdn',
  'assets', 'static', 'media', 'blog', 'shop'
];
```

### Updated Type Definition

```typescript
export interface LandingPageRow {
  id?: string;
  page_url_key: string;         // Keep for backward compatibility
  subdomain?: string;            // NEW: Optional subdomain
  status: 'draft' | 'published' | 'archived';
  page_content: {
    normalized: any;
    original?: any;
  };
  content_sha: string;
  buyer_id?: string;
  seller_id?: string;
  mmyy?: string;
  buyer_name?: string;
  seller_name?: string;
  version?: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}
```

---

## 5) Code Implementation

### 5.1) Create Middleware

**File:** `middleware.ts` (root directory)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Get the main domain from environment or default
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') || '';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Extract subdomain from hostname
 * Examples:
 * - adient.yourcompany.com → "adient"
 * - www.yourcompany.com → null (main domain)
 * - yourcompany.com → null (main domain)
 * - localhost:3000 → null (development)
 */
function extractSubdomain(hostname: string, mainDomain: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Skip localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    return null;
  }
  
  // Skip if it's the main domain
  if (host === mainDomain || host === `www.${mainDomain}`) {
    return null;
  }
  
  // Extract subdomain
  // Example: adient.yourcompany.com → adient
  const parts = host.split('.');
  const mainParts = mainDomain.split('.');
  
  // If more parts than main domain, first part is subdomain
  if (parts.length > mainParts.length) {
    const subdomain = parts[0];
    
    // Skip www
    if (subdomain === 'www') {
      return null;
    }
    
    return subdomain;
  }
  
  return null;
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  
  // Skip middleware for:
  // - API routes
  // - Static files
  // - Next.js internals
  // - Studio (admin area)
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/studio') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Extract subdomain
  const subdomain = extractSubdomain(hostname, MAIN_DOMAIN);
  
  // If no subdomain, continue normally
  if (!subdomain) {
    return NextResponse.next();
  }
  
  // Rewrite to dynamic route with subdomain context
  const url = request.nextUrl.clone();
  
  // If already on /p/[slug], add subdomain to search params
  if (pathname.startsWith('/p/')) {
    url.searchParams.set('_subdomain', subdomain);
    return NextResponse.rewrite(url);
  }
  
  // Otherwise, rewrite to /p/subdomain with flag
  url.pathname = `/p/${subdomain}`;
  url.searchParams.set('_subdomain', subdomain);
  url.searchParams.set('_subdomain_route', 'true');
  
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
```

### 5.2) Update Database Helper

**File:** `lib/db/publishedLanding.ts`

Add new function to fetch by subdomain:

```typescript
/**
 * Fetch a published landing page by subdomain
 * Returns null if not found or not published
 * 
 * @param subdomain - The subdomain to fetch
 * @returns Published landing page row or null
 */
export async function getPublishedLandingBySubdomain(
  subdomain: string
): Promise<LandingPageRow | null> {
  const { data, error } = await supabaseAdmin
    .from('landing_pages')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('[getPublishedLandingBySubdomain] Supabase error:', {
      subdomain,
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  return data as LandingPageRow;
}

/**
 * Fetch content by subdomain (convenience function)
 */
export async function getPublishedContentBySubdomain(
  subdomain: string
): Promise<NormalizedContent | null> {
  const row = await getPublishedLandingBySubdomain(subdomain);
  return extractNormalizedContent(row);
}
```

### 5.3) Update Public Route

**File:** `app/p/[slug]/page.tsx`

Update to support subdomain routing:

```typescript
/**
 * Public landing page route
 * Supports both:
 * 1. Subdomain routing: adient.yourcompany.com
 * 2. Path routing: yourcompany.com/p/adient-cyngn-1025
 */
export default async function PublicLandingPage({ 
  params,
  searchParams 
}: PublicRouteParams & { searchParams?: { _subdomain?: string; _subdomain_route?: string } }) {
  const slug = await getRouteSlug(params);
  const subdomain = searchParams?._subdomain;
  const isSubdomainRoute = searchParams?._subdomain_route === 'true';
  
  let landingPageRow: LandingPageRow | null = null;
  let content: NormalizedContent | null = null;
  
  // Priority 1: Subdomain lookup (if coming from wildcard domain)
  if (subdomain && isSubdomainRoute) {
    landingPageRow = await getPublishedLandingBySubdomain(subdomain);
    if (landingPageRow) {
      content = extractNormalizedContent(landingPageRow);
    }
  }
  
  // Priority 2: Slug-based lookup (backward compatibility or direct path access)
  if (!content) {
    content = await getPublishedContent(slug);
    if (!landingPageRow) {
      landingPageRow = await getPublishedLanding(slug);
    }
  }

  // Return 404 if page not found
  if (!content || !landingPageRow) {
    notFound();
  }

  // Extract analytics context
  const pageProps = {
    buyer_id: landingPageRow.buyer_id || 'unknown',
    seller_id: landingPageRow.seller_id,
    page_url_key: slug,
    content_sha: landingPageRow.content_sha,
    buyer_name: landingPageRow.buyer_name,
    seller_name: landingPageRow.seller_name,
  };

  return (
    <AnalyticsPageWrapper pageProps={pageProps}>
      <LandingPage content={content} />
    </AnalyticsPageWrapper>
  );
}

/**
 * Generate dynamic metadata
 * Support both subdomain and path routing
 */
export async function generateMetadata(
  { params, searchParams }: PublicRouteParams & { searchParams?: { _subdomain?: string; _subdomain_route?: string } }
): Promise<Metadata> {
  const slug = await getRouteSlug(params);
  const subdomain = searchParams?._subdomain;
  const isSubdomainRoute = searchParams?._subdomain_route === 'true';
  
  let content: NormalizedContent | null = null;
  
  // Try subdomain first
  if (subdomain && isSubdomainRoute) {
    content = await getPublishedContentBySubdomain(subdomain);
  }
  
  // Fall back to slug
  if (!content) {
    content = await getPublishedContent(slug);
  }

  if (!content) {
    return {
      title: 'Page Not Found',
      description: 'The requested landing page could not be found.',
    };
  }

  return generateMetadataFromContent(content);
}
```

### 5.4) Update Publish Action

**File:** `lib/actions/publishLanding.ts`

Add subdomain support to publish metadata:

```typescript
// Update PublishMeta interface
export interface PublishMeta {
  page_url_key: string;    // Keep for backward compatibility
  subdomain?: string;       // NEW: Optional subdomain
  buyer_id?: string;
  seller_id?: string;
  mmyy?: string;
  buyer_name?: string;
  seller_name?: string;
}

// Add subdomain validation
const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'app', 'dashboard', 'studio',
  'staging', 'dev', 'test', 'mail', 'ftp', 'cdn',
  'assets', 'static', 'media', 'blog', 'shop'
];

function validateSubdomain(subdomain: string): { valid: boolean; error?: string } {
  if (!SUBDOMAIN_REGEX.test(subdomain)) {
    return {
      valid: false,
      error: 'Subdomain must be lowercase alphanumeric with hyphens, 3-63 chars, cannot start/end with hyphen'
    };
  }
  
  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return {
      valid: false,
      error: `Subdomain '${subdomain}' is reserved and cannot be used`
    };
  }
  
  return { valid: true };
}

// Update publishLanding function
export async function publishLanding(
  rawJson: unknown,
  meta: unknown,
  secret?: string
): Promise<PublishResult> {
  // ... existing validation ...
  
  const publishMeta = meta as PublishMeta;
  
  // Validate subdomain if provided
  if (publishMeta.subdomain) {
    const subdomainValidation = validateSubdomain(publishMeta.subdomain);
    if (!subdomainValidation.valid) {
      return {
        ok: false,
        error: subdomainValidation.error,
      };
    }
    
    // Check if subdomain already exists for a different page
    const { data: existing } = await supabaseAdmin
      .from('landing_pages')
      .select('page_url_key')
      .eq('subdomain', publishMeta.subdomain)
      .eq('status', 'published')
      .neq('page_url_key', publishMeta.page_url_key)
      .single();
    
    if (existing) {
      return {
        ok: false,
        error: `Subdomain '${publishMeta.subdomain}' is already in use by another published page`,
      };
    }
  }
  
  // ... rest of existing logic ...
  
  // Update upsert to include subdomain
  const { error: upsertError } = await supabaseAdmin
    .from('landing_pages')
    .upsert({
      page_url_key: publishMeta.page_url_key,
      subdomain: publishMeta.subdomain || null,  // NEW
      status: 'published',
      page_content: {
        normalized,
        original: rawJson,
      },
      content_sha: contentSha,
      buyer_id: publishMeta.buyer_id,
      seller_id: publishMeta.seller_id,
      mmyy: publishMeta.mmyy,
      buyer_name: publishMeta.buyer_name,
      seller_name: publishMeta.seller_name,
      published_at: new Date().toISOString(),
    });
  
  // ... rest of existing logic ...
  
  // Return URL based on subdomain availability
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const mainDomain = baseUrl.replace(/^https?:\/\//, '');
  
  let publicUrl: string;
  if (publishMeta.subdomain && process.env.NODE_ENV === 'production') {
    // Use subdomain URL in production
    const protocol = baseUrl.startsWith('https') ? 'https' : 'http';
    publicUrl = `${protocol}://${publishMeta.subdomain}.${mainDomain}`;
  } else {
    // Fall back to path-based URL
    publicUrl = `${baseUrl}/p/${publishMeta.page_url_key}`;
  }
  
  return {
    ok: true,
    url: publicUrl,
    contentSha,
    changed: true,
  };
}
```

### 5.5) Update Studio UI (Optional)

**File:** `app/(studio)/studio/page.tsx`

Add subdomain input field (if you have a Studio UI form):

```typescript
// Add to your Studio form:
<div>
  <label htmlFor="subdomain">Subdomain (Optional)</label>
  <input
    type="text"
    id="subdomain"
    name="subdomain"
    placeholder="adient"
    pattern="[a-z0-9][a-z0-9-]{1,61}[a-z0-9]"
    title="Lowercase letters, numbers, and hyphens only. 3-63 characters."
  />
  <small>Will create: subdomain.yourcompany.com</small>
</div>
```

---

## 6) Vercel Configuration

### 6.1) Add Wildcard Domain

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to Settings → Domains

2. **Add Wildcard Domain**
   - Click "Add Domain"
   - Enter: `*.yourcompany.com`
   - Click "Add"

3. **Verify DNS**
   - Vercel will show DNS instructions
   - Copy the CNAME value

### 6.2) Environment Variables

Update `.env.local` and Vercel environment variables:

```bash
# Update your site URL to production domain
NEXT_PUBLIC_SITE_URL=https://yourcompany.com

# Ensure these are set in Vercel
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE=...
REVALIDATE_SECRET=...
STUDIO_PUBLISH_SECRET=...
```

### 6.3) Vercel.json (Optional)

Create `vercel.json` for additional configuration:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 7) DNS Setup

### 7.1) DNS Provider Configuration

In your DNS provider (GoDaddy, Namecheap, Cloudflare, etc.):

```
Record Type: CNAME
Host: *
Value: cname.vercel-dns.com
TTL: 3600 (or Auto)
```

**Alternative format (some providers):**
```
Name: *.yourcompany.com
Type: CNAME
Target: cname.vercel-dns.com
```

### 7.2) Main Domain (if not set)

Also ensure your main domain points to Vercel:

```
Record Type: A
Host: @
Value: 76.76.21.21
TTL: 3600

Record Type: CNAME
Host: www
Value: cname.vercel-dns.com
TTL: 3600
```

### 7.3) DNS Propagation

- DNS changes can take 5 minutes to 48 hours
- Use tools to check: https://dnschecker.org
- Test with: `nslookup adient.yourcompany.com`

---

## 8) Testing Plan

### 8.1) Local Testing

Since wildcard subdomains don't work on localhost, test with:

**Option 1: Hosts File**
```
# Add to /etc/hosts (Mac/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 adient.localhost
127.0.0.1 microsoft.localhost
127.0.0.1 test.localhost
```

Then access: `http://adient.localhost:3000`

**Option 2: Use Test Domain**
- Deploy to Vercel preview
- Use Vercel's preview URL with subdomain

### 8.2) Test Cases

#### Test 1: Subdomain Resolution
```
1. Create landing page with subdomain "test-buyer"
2. Visit: https://test-buyer.yourcompany.com
3. Expected: Page loads with correct content
4. Verify: Correct buyer_id in analytics
```

#### Test 2: Backward Compatibility
```
1. Visit old URL: https://yourcompany.com/p/adient-cyngn-1025
2. Expected: Page loads normally
3. Verify: Same content as subdomain version
```

#### Test 3: Subdomain Conflict
```
1. Publish page with subdomain "adient"
2. Try to publish different page with same subdomain
3. Expected: Error message about subdomain already in use
```

#### Test 4: Reserved Subdomains
```
1. Try to publish with subdomain "admin"
2. Expected: Error about reserved subdomain
```

#### Test 5: Invalid Subdomains
```
Test these and expect errors:
- "Ad_ient" (underscore not allowed)
- "ab" (too short)
- "-adient" (starts with hyphen)
- "adient-" (ends with hyphen)
- "ADIENT" (uppercase not allowed)
```

#### Test 6: Metadata & SEO
```
1. Visit subdomain URL
2. Check <title>, <meta description>
3. Expected: Correct metadata from normalized content
```

#### Test 7: Analytics Tracking
```
1. Visit subdomain URL
2. Check PostHog events
3. Expected: Correct buyer_id, seller_id, page_url_key
```

#### Test 8: 404 Handling
```
1. Visit non-existent subdomain: https://fake.yourcompany.com
2. Expected: 404 page
```

#### Test 9: Studio Publish Flow
```
1. Paste JSON in Studio
2. Enter subdomain "test-company"
3. Click Publish
4. Expected: Success message with subdomain URL
5. Visit URL and verify content
```

#### Test 10: Cache Invalidation
```
1. Publish page with subdomain "cache-test"
2. Visit URL (cache primed)
3. Update content and republish
4. Visit URL again
5. Expected: New content appears (cache invalidated)
```

### 8.3) Performance Testing

```bash
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s https://adient.yourcompany.com

# curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_redirect:  %{time_redirect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

### 8.4) Security Testing

```
1. Test HTTPS enforcement
2. Verify SSL certificate for wildcard
3. Test XSS protection headers
4. Check CORS policies
5. Verify no sensitive data in responses
```

---

## 9) Deployment Checklist

### Pre-Deployment

- [ ] Database migration executed (subdomain column added)
- [ ] Code changes committed and pushed to Git
- [ ] Environment variables updated in Vercel
- [ ] Backup current database
- [ ] Test all changes in preview environment

### DNS Setup

- [ ] Wildcard CNAME record added: `*.yourcompany.com → cname.vercel-dns.com`
- [ ] Main domain A record verified
- [ ] DNS propagation checked with dnschecker.org
- [ ] TTL set appropriately (3600 seconds recommended)

### Vercel Configuration

- [ ] Wildcard domain added in Vercel: `*.yourcompany.com`
- [ ] Domain verification completed (green checkmark)
- [ ] SSL certificate issued (automatic, but verify)
- [ ] Environment variables set in production

### Code Deployment

- [ ] Middleware deployed and active
- [ ] Database helper functions updated
- [ ] Public route updated to support subdomains
- [ ] Publish action supports subdomain field
- [ ] Studio UI updated (if applicable)

### Testing Post-Deployment

- [ ] Test subdomain URL works: `test.yourcompany.com`
- [ ] Test backward compatibility: `/p/[slug]` still works
- [ ] Test Studio publish with subdomain
- [ ] Verify analytics tracking
- [ ] Check SSL certificate
- [ ] Monitor error logs

### Communication

- [ ] Update documentation
- [ ] Notify team of new URL format
- [ ] Update any hardcoded URLs in marketing materials
- [ ] Update email templates with new URL format

---

## 10) Rollback Plan

### If Issues Occur

#### Option 1: Quick Disable (Keep Code, Disable Feature)

```typescript
// In middleware.ts, comment out the rewrite logic:
export function middleware(request: NextRequest) {
  // TEMPORARILY DISABLED FOR ROLLBACK
  return NextResponse.next();
  
  // ... rest of middleware commented out
}
```

Redeploy → Subdomains stop working, path-based URLs work normally.

#### Option 2: DNS Rollback

Remove wildcard DNS record:
- Subdomains stop resolving
- Path-based URLs continue working
- No code changes needed

#### Option 3: Full Rollback

1. Revert Git commits:
   ```bash
   git revert <commit-hash>
   git push
   ```

2. Remove wildcard domain from Vercel

3. Remove DNS wildcard record

4. Database rollback (if needed):
   ```sql
   ALTER TABLE landing_pages DROP COLUMN subdomain;
   ```

### Monitoring

Track these metrics post-deployment:

- Error rate on subdomain URLs
- 404 rate for subdomain requests
- DNS resolution success rate
- SSL certificate errors
- Performance impact (if any)

---

## 11) Future Enhancements

### Phase 2: Custom Buyer Domains (Optional Premium Feature)

Allow buyers to use their own domain (e.g., `promo.adient.com` points to your app):

```
Implementation:
1. Add custom_domain column to database
2. Buyer adds CNAME: promo.adient.com → cname.vercel-dns.com
3. Add domain in Vercel (can be automated via API)
4. Update middleware to check custom_domain first
5. Charge premium pricing for this feature
```

### Phase 3: Multi-Region Support

Deploy to multiple Vercel regions for lower latency:

```
Implementation:
1. Use Vercel Edge Network
2. Deploy to multiple regions
3. Use CDN for static assets
4. Implement geo-routing if needed
```

### Phase 4: Analytics Dashboard

Build dashboard showing subdomain usage:

```
Metrics to track:
- Most visited subdomains
- Conversion rates per subdomain
- Bounce rates
- Time on page
- Geographic distribution
```

---

## 12) FAQ & Troubleshooting

### Q: Subdomain not resolving?

**A:** Check:
1. DNS propagation (can take up to 48 hours)
2. Wildcard CNAME record is correct
3. Vercel domain verification completed
4. Try incognito/private browsing (clear DNS cache)

### Q: SSL certificate error on subdomain?

**A:** 
1. Wait 5-10 minutes for Vercel to issue certificate
2. Check Vercel dashboard → Domains → SSL status
3. Ensure wildcard domain is verified

### Q: Subdomain loads but shows wrong content?

**A:** Check:
1. Database query in route (log subdomain value)
2. Middleware is extracting subdomain correctly
3. Search params are passed to page component
4. Cache might be stale (force revalidate)

### Q: Path-based URLs stopped working?

**A:** 
1. Check middleware matcher config
2. Ensure backward compatibility logic is present
3. Verify routing priorities in page component

### Q: How to test locally?

**A:**
1. Use hosts file entries
2. Or deploy to Vercel preview
3. Or use ngrok/localtunnel for temporary domain

### Q: Performance impact of middleware?

**A:** Minimal - middleware adds ~1-5ms for subdomain extraction. DNS resolution is cached by browsers.

### Q: Can I have both subdomain and custom domain?

**A:** Yes! Update middleware to check both:
```typescript
// Priority 1: Custom domain
// Priority 2: Subdomain
// Priority 3: Path-based
```

---

## 13) Success Metrics

Track these KPIs after launch:

- ✅ % of new pages using subdomains vs paths
- ✅ Average time to publish (should be same or faster)
- ✅ Error rate (should be < 0.1%)
- ✅ Page load time (should be similar to path-based)
- ✅ SEO impact (check crawl errors in Search Console)
- ✅ User feedback (sales/marketing team input)

---

## 14) Resources

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Vercel Wildcard Domains](https://vercel.com/docs/projects/domains/wildcard-domains)
- [DNS CNAME Records](https://www.cloudflare.com/learning/dns/dns-records/dns-cname-record/)
- [Supabase Unique Constraints](https://supabase.com/docs/guides/database/postgres/constraints)

---

## 15) Appendix: Full File List

Files to create/modify:

### New Files
- ✅ `middleware.ts` (root)
- ✅ `docs/PART_D_Wildcard_Subdomains_Implementation.md` (this file)

### Modified Files
- ✅ `lib/db/publishedLanding.ts` (add subdomain functions)
- ✅ `lib/db/supabase.ts` (update LandingPageRow type)
- ✅ `app/p/[slug]/page.tsx` (add subdomain routing logic)
- ✅ `lib/actions/publishLanding.ts` (add subdomain validation & support)
- ⚠️ `app/(studio)/studio/page.tsx` (optional: add subdomain input)

### Database Changes
- ✅ Migration SQL (add subdomain column + indexes)

---

**Ready to implement? Start with Phase 1 (database changes), then Phase 2 (code), then Phase 3 (DNS/Vercel).**

**Questions? Check FAQ section or refer to your existing Part B implementation as reference.**

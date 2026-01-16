# 🚀 Custom Domain Implementation Plan

## 📋 Executive Summary

**Goal:** Add custom domain support to landing page platform  
**Strategy:** Hybrid approach (subdomain + custom domains)  
**Breaking Changes:** **NONE** - All existing functionality preserved  
**Estimated Time:** 6-8 hours of development  
**Testing Time:** 2-3 hours

---

## ✅ Vercel Pro Plan Requirement

### **Answer: YES, Vercel Pro is REQUIRED**

**Why:**
- **Custom Domains API Access:** Available on Pro ($20/month) and Enterprise only
- **Unlimited Custom Domains:** Hobby plan limited to 1 custom domain total
- **Domain API Endpoints:** Requires authenticated API access (Pro+)
- **SSL Certificates:** Automatic for custom domains (included in Pro)

**Cost Breakdown:**
```
Vercel Pro Plan: $20/month
- Unlimited custom domains
- 100GB bandwidth/month
- Commercial use
- Priority support
- API access for domain management
```

**Free Tier Limitations:**
```
Hobby Plan: $0/month
- 1 custom domain total (not per project)
- 100GB bandwidth/month
- Non-commercial use only
- No API access for domains
```

**Recommendation:** Upgrade to Pro before implementing custom domains.

---

## 🎯 Implementation Strategy

### **Phase 1: Preserve Existing (Path-Based)**
Current system `/p/[slug]` continues to work - **NO CHANGES**

### **Phase 2: Add Optional Subdomains**
Enable wildcard subdomains for branding (e.g., `adient.yoursite.com`)

### **Phase 3: Add Premium Custom Domains**
Support buyer-provided domains (e.g., `landing.adient.com`)

### **Routing Priority:**
1. Check custom domain first
2. Check subdomain second  
3. Fall back to path-based (`/p/[slug]`)

**Result:** All three approaches coexist without conflict.

---

## 📊 Architecture Overview

### **Current State**
```
User Request → /p/adient-cyngn-1025
              ↓
         Query by slug
              ↓
         Render content
```

### **Target State**
```
User Request → landing.adient.com
              ↓
         Middleware intercepts
              ↓
         Extract domain
              ↓
         Query by domain → Found? Render
                        → Not found? Try subdomain
                        → Still not found? Try path
```

---

## 🗄️ Database Changes

### **Schema Updates**

```sql
-- Add custom domain support (SAFE - no data loss)
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subdomain TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_landing_pages_custom_domain 
ON landing_pages(custom_domain) 
WHERE status = 'published' AND custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_landing_pages_subdomain 
ON landing_pages(subdomain) 
WHERE status = 'published' AND subdomain IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN landing_pages.custom_domain IS 
'Buyer-provided custom domain (e.g., landing.adient.com). Null if using subdomain only.';

COMMENT ON COLUMN landing_pages.subdomain IS 
'Auto-generated subdomain (e.g., adient for adient.yoursite.com). Derived from buyer_id.';
```

### **Data Migration (Safe)**

```sql
-- Populate subdomain from existing buyer_id (idempotent)
UPDATE landing_pages 
SET subdomain = buyer_id 
WHERE subdomain IS NULL AND buyer_id IS NOT NULL;

-- Verify no data loss
SELECT COUNT(*) FROM landing_pages WHERE status = 'published'; -- Before
-- Run migration
SELECT COUNT(*) FROM landing_pages WHERE status = 'published'; -- After (should match)
```

---

## 📁 File Structure (New Files)

```
landing-page-studio/
├── lib/
│   ├── vercel/
│   │   ├── domains.ts          ← NEW: Vercel API client
│   │   └── types.ts            ← NEW: Type definitions
│   └── db/
│       └── publishedLanding.ts ← MODIFIED: Add domain queries
├── middleware.ts                ← NEW: Domain routing
├── app/
│   └── p/[slug]/page.tsx        ← MODIFIED: Add domain support
└── docs/
    └── BUYER_DNS_SETUP.md       ← NEW: Instructions for buyers
```

---

## 🔧 Implementation Phases

---

## **PHASE 1: Environment & Prerequisites**

### **Step 1.1: Upgrade Vercel Plan**
```bash
# Actions:
1. Go to vercel.com/dashboard
2. Select your project
3. Settings → Billing → Upgrade to Pro
4. Cost: $20/month
```

### **Step 1.2: Generate Vercel API Token**
```bash
# Actions:
1. Go to vercel.com/account/tokens
2. Create new token: "Landing Page Domain Manager"
3. Scope: Full access (for domain management)
4. Copy token
```

### **Step 1.3: Add Environment Variables**
```bash
# Add to .env.local:
VERCEL_API_TOKEN=your_token_here
VERCEL_PROJECT_ID=prj_xxxxx  # Get from Vercel project settings
VERCEL_TEAM_ID=team_xxxxx    # Optional, if using team
```

### **Step 1.4: Backup Current Code**
```bash
# Create safety backup
git checkout -b backup-before-custom-domains
git add .
git commit -m "Backup before custom domain implementation"
git push origin backup-before-custom-domains

# Create working branch
git checkout -b feature/custom-domains
```

---

## **PHASE 2: Database Schema Updates**

### **Step 2.1: Run SQL Migration**

**File:** Create `migrations/001_add_custom_domains.sql`

```sql
-- Migration: Add custom domain support
-- Safe: No data loss, no breaking changes
-- Reversible: Can drop columns if needed

BEGIN;

-- Add columns
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS subdomain TEXT;

-- Add constraints
ALTER TABLE landing_pages 
ADD CONSTRAINT landing_pages_custom_domain_unique UNIQUE (custom_domain);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_landing_pages_custom_domain 
ON landing_pages(custom_domain) 
WHERE status = 'published' AND custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_landing_pages_subdomain 
ON landing_pages(subdomain) 
WHERE status = 'published' AND subdomain IS NOT NULL;

-- Populate subdomain from buyer_id
UPDATE landing_pages 
SET subdomain = LOWER(TRIM(buyer_id))
WHERE subdomain IS NULL 
  AND buyer_id IS NOT NULL 
  AND buyer_id != '';

-- Add comments
COMMENT ON COLUMN landing_pages.custom_domain IS 
'Buyer-provided custom domain (e.g., landing.adient.com)';

COMMENT ON COLUMN landing_pages.subdomain IS 
'Auto-generated subdomain from buyer_id (e.g., adient)';

COMMIT;
```

### **Step 2.2: Execute Migration**

```bash
# Option A: In Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Paste migration SQL
3. Click "Run"
4. Verify: Check Table Editor for new columns

# Option B: Via psql (if you have direct access)
psql $DATABASE_URL -f migrations/001_add_custom_domains.sql
```

### **Step 2.3: Verify Migration**

```sql
-- Verify columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'landing_pages'
  AND column_name IN ('custom_domain', 'subdomain');

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'landing_pages'
  AND indexname LIKE '%domain%';

-- Check data
SELECT id, buyer_id, subdomain, custom_domain, status
FROM landing_pages
LIMIT 10;
```

---

## **PHASE 3: Vercel API Integration**

### **Step 3.1: Create Vercel Domain Service**

**File:** `lib/vercel/domains.ts`

```typescript
/**
 * Vercel Domain Management API Client
 * Handles adding, removing, and verifying custom domains
 * Requires Vercel Pro plan
 */

const VERCEL_API_BASE = 'https://api.vercel.com';
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // Optional

if (!VERCEL_API_TOKEN) {
  throw new Error('VERCEL_API_TOKEN is required for domain management');
}

if (!VERCEL_PROJECT_ID) {
  throw new Error('VERCEL_PROJECT_ID is required for domain management');
}

/**
 * Add a custom domain to the Vercel project
 * POST /v10/projects/{projectId}/domains
 */
export async function addDomainToVercel(domain: string): Promise<{
  success: boolean;
  verified: boolean;
  verification?: Array<{ type: string; domain: string; value: string }>;
  error?: string;
}> {
  try {
    const url = `${VERCEL_API_BASE}/v10/projects/${VERCEL_PROJECT_ID}/domains`;
    const params = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';

    const response = await fetch(url + params, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Domain might already exist (400) - check if it's our domain
      if (response.status === 400 && data.error?.code === 'domain_already_in_use') {
        // Domain already added - check if it's verified
        const status = await checkDomainStatus(domain);
        return {
          success: true,
          verified: status.verified,
          verification: status.verification,
        };
      }

      return {
        success: false,
        verified: false,
        error: data.error?.message || 'Failed to add domain',
      };
    }

    return {
      success: true,
      verified: data.verified || false,
      verification: data.verification || [],
    };
  } catch (error) {
    console.error('[addDomainToVercel] Error:', error);
    return {
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check domain verification status
 * GET /v9/projects/{projectId}/domains/{domain}
 */
export async function checkDomainStatus(domain: string): Promise<{
  verified: boolean;
  verification?: Array<{ type: string; domain: string; value: string }>;
  error?: string;
}> {
  try {
    const url = `${VERCEL_API_BASE}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`;
    const params = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';

    const response = await fetch(url + params, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      return {
        verified: false,
        error: 'Domain not found or not accessible',
      };
    }

    const data = await response.json();

    return {
      verified: data.verified || false,
      verification: data.verification || [],
    };
  } catch (error) {
    console.error('[checkDomainStatus] Error:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove a custom domain from the Vercel project
 * DELETE /v9/projects/{projectId}/domains/{domain}
 */
export async function removeDomainFromVercel(domain: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const url = `${VERCEL_API_BASE}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`;
    const params = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';

    const response = await fetch(url + params, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      return {
        success: false,
        error: 'Failed to remove domain',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[removeDomainFromVercel] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify domain DNS configuration
 * POST /v9/projects/{projectId}/domains/{domain}/verify
 */
export async function verifyDomain(domain: string): Promise<{
  verified: boolean;
  error?: string;
}> {
  try {
    const url = `${VERCEL_API_BASE}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}/verify`;
    const params = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';

    const response = await fetch(url + params, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
      },
    });

    const data = await response.json();

    return {
      verified: data.verified || false,
      error: data.verified ? undefined : 'Domain not yet verified',
    };
  } catch (error) {
    console.error('[verifyDomain] Error:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**File:** `lib/vercel/types.ts`

```typescript
export interface VercelDomainResponse {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  verification?: VercelDomainVerification[];
  createdAt?: number;
  updatedAt?: number;
}

export interface VercelDomainVerification {
  type: 'TXT' | 'CNAME';
  domain: string;
  value: string;
  reason?: string;
}

export interface DomainAddResult {
  success: boolean;
  verified: boolean;
  verification?: VercelDomainVerification[];
  error?: string;
}
```

---

## **PHASE 4: Database Query Updates**

### **Step 4.1: Extend Database Functions**

**File:** `lib/db/publishedLanding.ts` (ADD to existing file)

```typescript
// ADD these functions to existing publishedLanding.ts

/**
 * Fetch published landing page by custom domain
 * Returns null if not found or not published
 */
export async function getPublishedLandingByDomain(
  domain: string
): Promise<LandingPageRow | null> {
  const { data, error } = await supabaseAdmin
    .from('landing_pages')
    .select('*')
    .eq('custom_domain', domain)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[getPublishedLandingByDomain] Error:', error);
    throw error;
  }

  return data as LandingPageRow;
}

/**
 * Fetch published landing page by subdomain
 * Returns null if not found or not published
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
      return null;
    }
    console.error('[getPublishedLandingBySubdomain] Error:', error);
    throw error;
  }

  return data as LandingPageRow;
}

/**
 * Universal landing page lookup
 * Tries: custom domain → subdomain → slug (in that order)
 */
export async function getPublishedLandingUniversal(params: {
  domain?: string;
  subdomain?: string;
  slug?: string;
}): Promise<LandingPageRow | null> {
  // Priority 1: Custom domain
  if (params.domain) {
    const byDomain = await getPublishedLandingByDomain(params.domain);
    if (byDomain) return byDomain;
  }

  // Priority 2: Subdomain
  if (params.subdomain) {
    const bySubdomain = await getPublishedLandingBySubdomain(params.subdomain);
    if (bySubdomain) return bySubdomain;
  }

  // Priority 3: Slug (existing path-based)
  if (params.slug) {
    return getPublishedLanding(params.slug);
  }

  return null;
}
```

---

## **PHASE 5: Middleware for Domain Routing**

### **Step 5.1: Create Middleware**

**File:** `middleware.ts` (NEW FILE at root)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle custom domain and subdomain routing
 * 
 * Flow:
 * 1. Check if request is to custom domain
 * 2. Extract subdomain if wildcard domain
 * 3. Pass domain info to route via searchParams
 * 4. Route determines which page to render
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Skip middleware for:
  // - Localhost development
  // - Vercel deployment URLs (*.vercel.app)
  // - API routes
  // - Static files
  const isLocalhost = hostname.includes('localhost');
  const isVercelDomain = hostname.includes('.vercel.app');
  const isApiRoute = url.pathname.startsWith('/api');
  const isStaticFile = url.pathname.startsWith('/_next') || 
                        url.pathname.startsWith('/favicon') ||
                        url.pathname.includes('.');

  if (isLocalhost || isVercelDomain || isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  // Get main domain from env (e.g., "yoursite.com")
  const mainDomain = process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '').replace(/:\d+$/, '');

  // Check if this is the main domain
  const isMainDomain = mainDomain && hostname === mainDomain;

  if (isMainDomain) {
    // Main domain - use path-based routing (existing behavior)
    return NextResponse.next();
  }

  // Check if this is a subdomain of main domain
  const isSubdomain = mainDomain && hostname.endsWith(`.${mainDomain}`);

  if (isSubdomain) {
    // Extract subdomain (e.g., "adient" from "adient.yoursite.com")
    const subdomain = hostname.replace(`.${mainDomain}`, '');
    
    // Pass subdomain to route
    url.searchParams.set('_subdomain', subdomain);
    url.searchParams.set('_routing_type', 'subdomain');
    
    // Rewrite to dynamic route
    url.pathname = '/p/domain-route';
    return NextResponse.rewrite(url);
  }

  // Otherwise, treat as custom domain
  url.searchParams.set('_domain', hostname);
  url.searchParams.set('_routing_type', 'custom_domain');
  
  // Rewrite to dynamic route
  url.pathname = '/p/domain-route';
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
```

---

## **PHASE 6: Update Public Route**

### **Step 6.1: Create Domain Route**

**File:** `app/p/domain-route/page.tsx` (NEW FILE)

```typescript
/**
 * Domain-based landing page route
 * Handles custom domains and subdomains
 * Accessed via middleware rewrite
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  getPublishedLandingUniversal,
  extractNormalizedContent,
  generateMetadataFromContent,
} from '@/lib/db/publishedLanding';
import { LandingPage } from '@/components/landing/LandingPage';
import { AnalyticsPageWrapper } from '@/components/analytics/AnalyticsPageWrapper';

interface DomainRouteProps {
  searchParams: {
    _domain?: string;
    _subdomain?: string;
    _routing_type?: 'custom_domain' | 'subdomain';
  };
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata(
  { searchParams }: DomainRouteProps
): Promise<Metadata> {
  const landingPage = await getPublishedLandingUniversal({
    domain: searchParams._domain,
    subdomain: searchParams._subdomain,
  });

  if (!landingPage) {
    return {
      title: 'Page Not Found',
      description: 'The requested landing page could not be found.',
    };
  }

  const content = extractNormalizedContent(landingPage);
  if (!content) {
    return {
      title: 'Error Loading Page',
      description: 'Unable to load page content.',
    };
  }

  return generateMetadataFromContent(content);
}

/**
 * Domain-based landing page route
 */
export default async function DomainRoutePage({ searchParams }: DomainRouteProps) {
  const landingPage = await getPublishedLandingUniversal({
    domain: searchParams._domain,
    subdomain: searchParams._subdomain,
  });

  if (!landingPage) {
    notFound();
  }

  const content = extractNormalizedContent(landingPage);
  if (!content) {
    notFound();
  }

  // Extract analytics context
  const pageProps = {
    buyer_id: landingPage.buyer_id || 'unknown',
    seller_id: landingPage.seller_id,
    page_url_key: landingPage.page_url_key,
    content_sha: landingPage.content_sha,
    buyer_name: landingPage.buyer_name,
    seller_name: landingPage.seller_name,
    custom_domain: landingPage.custom_domain,
    subdomain: landingPage.subdomain,
  };

  return (
    <AnalyticsPageWrapper pageProps={pageProps}>
      <LandingPage content={content} />
    </AnalyticsPageWrapper>
  );
}
```

### **Step 6.2: Keep Existing Route (Backward Compatibility)**

**File:** `app/p/[slug]/page.tsx` (NO CHANGES - stays the same!)

Existing route continues to work for `/p/slug` URLs. No modifications needed.

---

## **PHASE 7: Update Publish Action**

### **Step 7.1: Extend Publish Metadata**

**File:** `lib/validate/publishMeta.ts` (ADD to existing)

```typescript
// ADD to existing PublishMeta interface
export interface PublishMeta {
  // ... existing fields
  page_url_key: string;
  buyer_id?: string;
  seller_id?: string;
  mmyy?: string;
  buyer_name?: string;
  seller_name?: string;
  
  // NEW: Custom domain support
  custom_domain?: string;  // e.g., "landing.adient.com"
  enable_subdomain?: boolean; // Auto-generate subdomain from buyer_id
}

// ADD validation for custom domain
export function validateCustomDomain(domain: string): {
  valid: boolean;
  error?: string;
} {
  // Basic domain validation
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  
  if (!domainRegex.test(domain)) {
    return {
      valid: false,
      error: 'Invalid domain format. Example: landing.adient.com',
    };
  }

  // Check for common issues
  if (domain.includes('://')) {
    return {
      valid: false,
      error: 'Domain should not include protocol (http:// or https://)',
    };
  }

  if (domain.includes('/')) {
    return {
      valid: false,
      error: 'Domain should not include paths',
    };
  }

  return { valid: true };
}
```

### **Step 7.2: Update Publish Action**

**File:** `lib/actions/publishLanding.ts` (MODIFY existing function)

```typescript
// FIND the publishLanding function and ADD custom domain support

export async function publishLanding(
  rawJson: unknown,
  meta: unknown,
  secret?: string
): Promise<PublishResult> {
  // ... existing validation code ...

  // NEW: Validate custom domain if provided
  if (validatedMeta.custom_domain) {
    const domainValidation = validateCustomDomain(validatedMeta.custom_domain);
    if (!domainValidation.valid) {
      return {
        ok: false,
        error: `Custom domain validation failed: ${domainValidation.error}`,
      };
    }

    // NEW: Add domain to Vercel
    console.log(`[publishLanding] Adding custom domain: ${validatedMeta.custom_domain}`);
    const domainResult = await addDomainToVercel(validatedMeta.custom_domain);
    
    if (!domainResult.success) {
      return {
        ok: false,
        error: `Failed to add custom domain to Vercel: ${domainResult.error}`,
      };
    }

    if (!domainResult.verified) {
      console.warn(`[publishLanding] Domain not yet verified: ${validatedMeta.custom_domain}`);
      // Continue anyway - buyer needs to configure DNS
    }
  }

  // NEW: Auto-generate subdomain from buyer_id if enabled
  let subdomain: string | null = null;
  if (validatedMeta.enable_subdomain && validatedMeta.buyer_id) {
    subdomain = validatedMeta.buyer_id.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  }

  // ... existing normalization and hashing code ...

  // MODIFY: Upsert to include new fields
  const { error: upsertError } = await supabaseAdmin
    .from('landing_pages')
    .upsert({
      page_url_key: validatedMeta.page_url_key,
      status: 'published',
      page_content: { normalized },
      content_sha: contentSha,
      buyer_id: validatedMeta.buyer_id,
      seller_id: validatedMeta.seller_id,
      mmyy: validatedMeta.mmyy,
      buyer_name: validatedMeta.buyer_name,
      seller_name: validatedMeta.seller_name,
      published_at: new Date().toISOString(),
      
      // NEW: Domain fields
      custom_domain: validatedMeta.custom_domain || null,
      subdomain: subdomain,
    }, {
      onConflict: 'page_url_key',
    });

  // ... existing error handling ...

  // MODIFY: Return appropriate URL based on what's available
  let publicUrl = `${siteUrl}/p/${validatedMeta.page_url_key}`;
  
  if (validatedMeta.custom_domain) {
    publicUrl = `https://${validatedMeta.custom_domain}`;
  } else if (subdomain) {
    const mainDomain = siteUrl.replace(/^https?:\/\//, '');
    publicUrl = `https://${subdomain}.${mainDomain}`;
  }

  return {
    ok: true,
    url: publicUrl,
    contentSha,
    changed: true,
  };
}
```

---

## **PHASE 8: Testing Plan**

### **Test 1: Existing Functionality (Backward Compatibility)**

```bash
# Test existing path-based routing still works
curl -I http://localhost:3000/p/adient-cyngn-1025
# Expected: 200 OK

# Test in browser
open http://localhost:3000/p/adient-cyngn-1025
# Expected: Page renders correctly, no errors
```

### **Test 2: Subdomain Routing (Local)**

```bash
# Add to /etc/hosts (Mac/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 adient.localhost
127.0.0.1 microsoft.localhost

# Test subdomain
curl -I http://adient.localhost:3000
# Expected: 200 OK or rewrite to domain-route

# Test in browser
open http://adient.localhost:3000
# Expected: Correct content for Adient
```

### **Test 3: Database Queries**

```sql
-- Test domain lookup
SELECT * FROM landing_pages WHERE custom_domain = 'landing.adient.com';

-- Test subdomain lookup
SELECT * FROM landing_pages WHERE subdomain = 'adient';

-- Test indexes are used
EXPLAIN ANALYZE 
SELECT * FROM landing_pages 
WHERE custom_domain = 'landing.adient.com' AND status = 'published';
-- Expected: Uses idx_landing_pages_custom_domain
```

### **Test 4: Vercel API Integration**

```typescript
// Create test script: scripts/test-vercel-api.ts
import { addDomainToVercel, checkDomainStatus } from '@/lib/vercel/domains';

async function test() {
  console.log('Testing Vercel API...');
  
  // Test add domain
  const result = await addDomainToVercel('test.example.com');
  console.log('Add domain result:', result);
  
  // Test check status
  const status = await checkDomainStatus('test.example.com');
  console.log('Domain status:', status);
}

test();
```

```bash
# Run test
npx tsx scripts/test-vercel-api.ts
```

### **Test 5: End-to-End Publish Flow**

```typescript
// Test publish with custom domain
const result = await publishLanding(
  sampleJson,
  {
    page_url_key: 'test-custom-domain',
    buyer_id: 'testbuyer',
    seller_id: 'cyngn',
    custom_domain: 'landing.testbuyer.com',
    enable_subdomain: true,
  },
  process.env.STUDIO_PUBLISH_SECRET
);

console.log('Publish result:', result);
// Expected: 
// - success: true
// - url: "https://landing.testbuyer.com"
// - Domain added to Vercel
// - Database updated
```

---

## **PHASE 9: Documentation**

### **Doc 1: Buyer DNS Setup Instructions**

**File:** `docs/BUYER_DNS_SETUP.md`

```markdown
# Custom Domain Setup for Buyers

## Quick Start

To use your own domain (e.g., `landing.yourdomain.com`) for your landing page:

### Step 1: Choose a Subdomain

Pick a subdomain on your domain:
- `landing.yourdomain.com` ✅ (recommended)
- `promo.yourdomain.com` ✅
- `offer.yourdomain.com` ✅

### Step 2: Add DNS Record

Go to your DNS provider (GoDaddy, Namecheap, Cloudflare, etc.) and add:

```
Type: CNAME
Name: landing (or your chosen subdomain)
Value: cname.vercel-dns.com
TTL: 3600 (or automatic)
```

### Step 3: Notify Us

Send us an email with:
- Your chosen domain (e.g., `landing.yourdomain.com`)
- Your buyer ID

We'll configure it on our end (takes 5 minutes).

### Step 4: Wait for Propagation

- DNS changes take 5 minutes to 48 hours
- Usually works within 5-15 minutes
- SSL certificate issued automatically

### Step 5: Verify

Visit `https://landing.yourdomain.com` - you should see your landing page!

---

## Provider-Specific Instructions

### GoDaddy
1. Log in to GoDaddy
2. Go to "My Products" → "DNS"
3. Click "Add" under records
4. Select "CNAME"
5. Name: `landing`
6. Value: `cname.vercel-dns.com`
7. TTL: `1 hour`
8. Save

### Namecheap
1. Log in to Namecheap
2. Go to "Domain List" → Manage
3. Select "Advanced DNS"
4. Click "Add New Record"
5. Type: `CNAME Record`
6. Host: `landing`
7. Value: `cname.vercel-dns.com`
8. TTL: `Automatic`
9. Save

### Cloudflare
1. Log in to Cloudflare
2. Select your domain
3. Go to "DNS" → "Records"
4. Click "Add record"
5. Type: `CNAME`
6. Name: `landing`
7. Target: `cname.vercel-dns.com`
8. Proxy status: DNS only (gray cloud) ⚠️ IMPORTANT
9. Save

---

## Troubleshooting

### "Domain not found" error
- Wait longer (DNS propagation can take up to 48 hours)
- Check DNS record is correct: `nslookup landing.yourdomain.com`

### "SSL certificate error"
- Certificate is issued after DNS verification
- Usually takes 5-10 minutes
- If persists after 1 hour, contact support

### Cloudflare users
- Must disable proxy (gray cloud, not orange)
- Orange cloud will break verification
```

### **Doc 2: Internal Operations Guide**

**File:** `docs/OPERATIONS_CUSTOM_DOMAINS.md`

```markdown
# Operations Guide: Custom Domains

## Daily Operations

### Adding a Custom Domain for a Buyer

1. **Receive Request**
   - Buyer provides: `landing.theircompany.com`
   - Buyer provides: their buyer_id

2. **Verify DNS**
   ```bash
   nslookup landing.theircompany.com
   # Should show: cname.vercel-dns.com
   ```

3. **Update Database**
   ```sql
   UPDATE landing_pages 
   SET custom_domain = 'landing.theircompany.com'
   WHERE buyer_id = 'theircompany';
   ```

4. **Publish**
   - In Studio, publish with custom_domain field
   - System automatically adds to Vercel
   - System automatically verifies DNS

5. **Confirm**
   - Visit `https://landing.theircompany.com`
   - Should load their page
   - Check SSL certificate

### Removing a Custom Domain

1. **Remove from Database**
   ```sql
   UPDATE landing_pages 
   SET custom_domain = NULL
   WHERE custom_domain = 'landing.theircompany.com';
   ```

2. **Remove from Vercel** (optional, for cleanup)
   ```typescript
   await removeDomainFromVercel('landing.theircompany.com');
   ```

---

## Monitoring

### Check All Custom Domains
```sql
SELECT 
  buyer_id, 
  custom_domain, 
  subdomain,
  status,
  published_at
FROM landing_pages
WHERE custom_domain IS NOT NULL
ORDER BY published_at DESC;
```

### Verify Domain Status
```bash
# Check DNS
nslookup landing.buyerdomain.com

# Check HTTP
curl -I https://landing.buyerdomain.com

# Check in Vercel Dashboard
# Settings → Domains → See all domains
```

---

## Troubleshooting

### Domain Not Resolving

**Symptom:** `landing.buyer.com` returns 404

**Check:**
1. DNS correct? `nslookup landing.buyer.com` → should show `cname.vercel-dns.com`
2. Domain in database? Check `custom_domain` field
3. Domain in Vercel? Check Vercel dashboard → Domains
4. Page published? Check `status = 'published'`

**Fix:**
```sql
-- Re-publish to trigger domain addition
UPDATE landing_pages 
SET updated_at = NOW()
WHERE custom_domain = 'landing.buyer.com';
```

### SSL Certificate Issues

**Symptom:** Browser shows "Not Secure" or SSL error

**Check:**
1. Domain verified in Vercel? (Vercel dashboard → Domains → Status)
2. DNS propagated? (Can take up to 48 hours)
3. Cloudflare proxy disabled? (Must use DNS only)

**Fix:**
- Wait for DNS propagation
- In Vercel: Domains → Refresh → Renew Certificate

---

## Cost Tracking

### Current Domains
```sql
SELECT 
  COUNT(*) as total_custom_domains,
  COUNT(DISTINCT buyer_id) as unique_buyers
FROM landing_pages
WHERE custom_domain IS NOT NULL AND status = 'published';
```

**Cost:** $0 per domain (included in Vercel Pro $20/month)
```

---

## **PHASE 10: Deployment Checklist**

### **Pre-Deployment**

```bash
✅ Vercel Pro plan activated
✅ Vercel API token generated and added to .env
✅ Database migration executed and verified
✅ All new code committed to feature branch
✅ Existing tests pass
✅ New tests written and passing
✅ Documentation completed
```

### **Deployment Steps**

```bash
# 1. Merge feature branch
git checkout main
git merge feature/custom-domains

# 2. Push to GitHub
git push origin main

# 3. Vercel auto-deploys

# 4. Add env vars in Vercel Dashboard
# Settings → Environment Variables → Add:
# - VERCEL_API_TOKEN
# - VERCEL_PROJECT_ID
# - VERCEL_TEAM_ID (if applicable)

# 5. Redeploy to pick up new env vars
# Vercel Dashboard → Deployments → Redeploy

# 6. Test production
curl -I https://yoursite.com/p/test-slug
# Expected: 200 OK
```

### **Post-Deployment Verification**

```bash
✅ Existing pages still work (/p/slug)
✅ Analytics still tracking
✅ Publish still works
✅ Database queries fast (check indexes)
✅ No console errors
✅ SSL certificates working
```

---

## 🚨 Rollback Plan

### **If Something Goes Wrong**

```bash
# 1. Revert deployment in Vercel
Vercel Dashboard → Deployments → Select previous deployment → Promote to Production

# 2. Revert database changes (if needed)
# Run rollback script:

BEGIN;

-- Remove new columns (ONLY if necessary)
ALTER TABLE landing_pages DROP COLUMN IF EXISTS custom_domain;
ALTER TABLE landing_pages DROP COLUMN IF EXISTS subdomain;

-- Drop indexes
DROP INDEX IF EXISTS idx_landing_pages_custom_domain;
DROP INDEX IF EXISTS idx_landing_pages_subdomain;

COMMIT;

# 3. Revert code
git revert HEAD
git push origin main

# 4. Remove env vars
# Vercel Dashboard → Settings → Environment Variables → Delete new vars
```

---

## 📊 Success Metrics

### **Technical Metrics**
- ✅ Zero existing page breakages
- ✅ Page load time < 200ms (same as before)
- ✅ Database query time < 50ms
- ✅ SSL certificates auto-issued within 10 minutes

### **Business Metrics**
- Track custom domain adoption rate
- Monitor buyer feedback
- Track support tickets related to domains

---

## 🎯 Next Steps After Implementation

### **Phase 11 (Future Enhancements)**

1. **Admin Dashboard**
   - UI to manage custom domains
   - View all domains and their status
   - One-click domain verification

2. **Automated DNS Verification**
   - Webhook from Vercel on domain verification
   - Email buyer when domain is ready
   - Auto-retry failed verifications

3. **Domain Analytics**
   - Track traffic by domain
   - A/B test different domains
   - Domain performance metrics

4. **Bulk Domain Import**
   - CSV upload for multiple buyers
   - Batch domain configuration
   - Progress tracking

---

## 📝 Summary

### **What We're Building**
Hybrid domain support (path + subdomain + custom)

### **Breaking Changes**
**NONE** - All existing functionality preserved

### **Time Estimate**
- Development: 6-8 hours
- Testing: 2-3 hours
- Deployment: 1 hour
- Total: ~10-12 hours

### **Costs**
- Vercel Pro: $20/month (REQUIRED)
- Custom domains: $0 (unlimited included in Pro)
- Total: $20/month

### **Risk Level**
**LOW** - Additive changes only, existing routes untouched

### **Confidence Level**
**HIGH** - Well-documented API, clear implementation path

---

## 🙋 Questions?

Check the implementation plan against:
- [x] Vercel API documented
- [x] Database changes safe
- [x] Backward compatibility ensured
- [x] Rollback plan ready
- [x] Testing strategy defined
- [x] Cost confirmed

**Ready to implement!** 🚀

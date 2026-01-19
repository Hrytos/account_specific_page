/**
 * CONTEXT FOR COPILOT — PART B (Multi-Tenant)
 * Public route: /p/[slug]
 * 
 * - Fetches published landing pages from Supabase
 * - Uses On-Demand ISR with cache tags: "landing:{slug}"
 * - Renders using Part A components (Hero, Benefits, Options, etc.)
 * - Generates dynamic metadata from normalized content
 * - Returns 404 for missing/unpublished pages
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  getPublishedContent,
  getPublishedLanding,
  getPublishedContentBySubdomain,
  getPublishedLandingBySubdomain,
  generateMetadataFromContent,
  type PublicRouteParams,
  getRouteSlug,
} from '@/lib/db/publishedLanding';
import { LandingPage } from '@/components/landing/LandingPage';
import { AnalyticsPageWrapper } from '@/components/analytics/AnalyticsPageWrapper';

/**
 * Extended route params that include searchParams for subdomain routing
 */
interface ExtendedRouteParams extends PublicRouteParams {
  searchParams?: Promise<{ _subdomain?: string; _subdomain_route?: string }>;
}

/**
 * Generate dynamic metadata for SEO
 * Supports both subdomain and path routing
 */
export async function generateMetadata(
  { params, searchParams }: ExtendedRouteParams
): Promise<Metadata> {
  const slug = await getRouteSlug(params);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const subdomain = resolvedSearchParams?._subdomain;
  const isSubdomainRoute = resolvedSearchParams?._subdomain_route === 'true';
  
  let content = null;
  
  // Priority 1: Subdomain lookup (if coming from wildcard domain)
  if (subdomain && isSubdomainRoute) {
    content = await getPublishedContentBySubdomain(subdomain);
  }
  
  // Priority 2: Slug-based lookup (backward compatibility)
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

/**
 * Public landing page route
 * Supports both:
 * 1. Subdomain routing: adient.yourcompany.com
 * 2. Path routing: yourcompany.com/p/adient-cyngn-1025
 * 
 * URL Examples:
 * - /p/adient-cyngn-1025 (path-based)
 * - adient.yourcompany.com (subdomain-based)
 */
export default async function PublicLandingPage({ params, searchParams }: ExtendedRouteParams) {
  const slug = await getRouteSlug(params);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const subdomain = resolvedSearchParams?._subdomain;
  const isSubdomainRoute = resolvedSearchParams?._subdomain_route === 'true';
  
  let landingPageRow = null;
  let content = null;
  
  // Priority 1: Subdomain lookup (if coming from wildcard domain)
  if (subdomain && isSubdomainRoute) {
    landingPageRow = await getPublishedLandingBySubdomain(subdomain);
    if (landingPageRow) {
      content = await getPublishedContentBySubdomain(subdomain);
    }
  }
  
  // Priority 2: Slug-based lookup (backward compatibility or direct path access)
  if (!content) {
    const [slugContent, slugRow] = await Promise.all([
      getPublishedContent(slug),
      getPublishedLanding(slug)
    ]);
    content = slugContent;
    if (!landingPageRow) {
      landingPageRow = slugRow;
    }
  }

  // Return 404 if page not found or not published
  if (!content || !landingPageRow) {
    notFound();
  }

  // Extract analytics context from the landing page row
  const pageProps = {
    buyer_id: landingPageRow.buyer_id || 'unknown',
    seller_id: landingPageRow.seller_id,
    page_url_key: landingPageRow.page_url_key,
    content_sha: landingPageRow.content_sha,
  };

  // Render the landing page with analytics wrapper
  return (
    <AnalyticsPageWrapper pageProps={pageProps}>
      <LandingPage content={content} />
    </AnalyticsPageWrapper>
  );
}

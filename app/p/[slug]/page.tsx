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
  getPublishedContentByDomain,
  getPublishedLandingByDomain,
  generateMetadataFromContent,
  type PublicRouteParams,
  getRouteSlug,
} from '@/lib/db/publishedLanding';
import { LandingPage } from '@/components/landing/LandingPage';
import { AnalyticsPageWrapper } from '@/components/analytics/AnalyticsPageWrapper';

/**
 * Extended route params that include searchParams for domain routing
 */
interface ExtendedRouteParams extends PublicRouteParams {
  searchParams?: Promise<{ _buyer_id?: string; _seller_domain?: string; _domain_route?: string }>;
}

/**
 * Generate dynamic metadata for SEO
 * Supports both wildcard domain and path routing
 */
export async function generateMetadata(
  { params, searchParams }: ExtendedRouteParams
): Promise<Metadata> {
  const slug = await getRouteSlug(params);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const buyerId = resolvedSearchParams?._buyer_id;
  const sellerDomain = resolvedSearchParams?._seller_domain;
  const isDomainRoute = resolvedSearchParams?._domain_route === 'true';
  
  let content = null;
  
  // Priority 1: Domain lookup (if coming from wildcard domain)
  if (buyerId && sellerDomain && isDomainRoute) {
    content = await getPublishedContentByDomain(buyerId, sellerDomain);
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
 * 1. Wildcard domain routing: adient.cyngn.com
 * 2. Path routing: yoursite.com/p/adient-cyngn-1025
 * 
 * URL Examples:
 * - /p/adient-cyngn-1025 (path-based)
 * - adient.cyngn.com (wildcard domain-based)
 */
export default async function PublicLandingPage({ params, searchParams }: ExtendedRouteParams) {
  const slug = await getRouteSlug(params);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const buyerId = resolvedSearchParams?._buyer_id;
  const sellerDomain = resolvedSearchParams?._seller_domain;
  const isDomainRoute = resolvedSearchParams?._domain_route === 'true';
  
  let landingPageRow = null;
  let content = null;
  
  // Priority 1: Domain lookup (if coming from wildcard domain)
  if (buyerId && sellerDomain && isDomainRoute) {
    landingPageRow = await getPublishedLandingByDomain(buyerId, sellerDomain);
    if (landingPageRow) {
      content = await getPublishedContentByDomain(buyerId, sellerDomain);
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

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
  generateMetadataFromContent,
  type PublicRouteParams,
  getRouteSlug,
} from '@/lib/db/publishedLanding';
import { LandingPage } from '@/components/landing/LandingPage';
import { AnalyticsPageWrapper } from '@/components/analytics/AnalyticsPageWrapper';

/**
 * Generate dynamic metadata for SEO
 * Called by Next.js before rendering the page
 */
export async function generateMetadata(
  { params }: PublicRouteParams
): Promise<Metadata> {
  const slug = await getRouteSlug(params);
  const content = await getPublishedContent(slug);

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
 * Serves published pages for any company/tenant
 * 
 * URL: /p/{slug}
 * Example: /p/adient-cyngn-1025
 */
export default async function PublicLandingPage({ params }: PublicRouteParams) {
  const slug = await getRouteSlug(params);
  
  // Fetch both content and full landing page row for analytics context
  const [content, landingPageRow] = await Promise.all([
    getPublishedContent(slug),
    getPublishedLanding(slug)
  ]);

  // Return 404 if page not found or not published
  if (!content || !landingPageRow) {
    notFound();
  }

  // Extract analytics context from the landing page row
  const pageProps = {
    buyer_id: landingPageRow.buyer_id || 'unknown',
    seller_id: landingPageRow.seller_id,
    page_url_key: slug,
    content_sha: landingPageRow.content_sha,
    buyer_name: landingPageRow.buyer_name,
    seller_name: landingPageRow.seller_name,
  };

  // Render the landing page with analytics wrapper
  return (
    <AnalyticsPageWrapper pageProps={pageProps}>
      <LandingPage content={content} />
    </AnalyticsPageWrapper>
  );
}

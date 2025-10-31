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
  generateMetadataFromContent,
  type PublicRouteParams,
  getRouteSlug,
} from '@/lib/db/publishedLanding';
import { LandingPage } from '@/components/landing/LandingPage';

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
  const content = await getPublishedContent(slug);

  // Return 404 if page not found or not published
  if (!content) {
    notFound();
  }

  // Render the landing page using Part A components
  return <LandingPage content={content} />;
}

/**
 * CONTEXT FOR COPILOT — PART B (Multi-Tenant)
 * Helper functions to fetch published landing pages from Supabase
 * with cache tags for On-Demand ISR.
 */

import { supabaseAdmin, type LandingPageRow, hasNormalizedContent } from './supabase';
import type { NormalizedContent } from '@/lib/normalize/normalized.types';

/**
 * Cache tag format for Option A (Global Slugs)
 * Example: "landing:adient-cyngn-1025"
 */
export function getLandingCacheTag(slug: string): string {
  return `landing:${slug}`;
}

/**
 * Fetch a published landing page by slug with ISR cache tags
 * Returns null if not found or not published
 * 
 * Cache behavior:
 * - Tagged with "landing:{slug}"
 * - Revalidated on-demand via /api/revalidate
 * 
 * @param slug - The page_url_key to fetch
 * @returns Published landing page row or null
 */
export async function getPublishedLanding(slug: string): Promise<LandingPageRow | null> {
  
  const { data, error } = await supabaseAdmin
    .from('landing_pages')
    .select('*')
    .eq('page_url_key', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    // Not found is expected for 404s
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[getPublishedLanding] Supabase error:', {
      slug,
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  return data as LandingPageRow;
}

/**
 * Extract normalized content from a landing page row
 * Validates that the content structure is correct
 * 
 * @param row - Landing page row from database
 * @returns Normalized content or null if invalid
 */
export function extractNormalizedContent(
  row: LandingPageRow | null
): NormalizedContent | null {
  if (!row) {
    return null;
  }

  const { page_content } = row;

  if (!hasNormalizedContent(page_content)) {
    console.error('[extractNormalizedContent] Invalid page_content structure:', {
      slug: row.page_url_key,
      hasNormalized: 'normalized' in (page_content || {}),
    });
    return null;
  }

  return page_content.normalized as NormalizedContent;
}

/**
 * Convenience function: fetch and extract in one call
 * Returns normalized content ready for rendering
 * 
 * @param slug - The page_url_key to fetch
 * @returns Normalized content or null
 */
export async function getPublishedContent(
  slug: string
): Promise<NormalizedContent | null> {
  const row = await getPublishedLanding(slug);
  return extractNormalizedContent(row);
}

/**
 * Generate metadata from normalized content
 * Used by Next.js generateMetadata() function
 * 
 * @param content - Normalized content
 * @returns Metadata object for Next.js
 */
export function generateMetadataFromContent(content: NormalizedContent) {
  const { title, seo, hero } = content;

  return {
    title: title || hero.headline,
    description: seo?.description || hero.subhead || undefined,
    openGraph: {
      title: title || hero.headline,
      description: seo?.description || hero.subhead || undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title || hero.headline,
      description: seo?.description || hero.subhead || undefined,
    },
  };
}

/**
 * Type for the public route params
 */
export interface PublicRouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Helper to await and validate route params
 * Next.js 15+ requires awaiting params
 */
export async function getRouteSlug(params: Promise<{ slug: string }>): Promise<string> {
  const resolved = await params;
  return resolved.slug;
}

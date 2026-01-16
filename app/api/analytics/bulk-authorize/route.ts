/**
 * Bulk Authorization API
 * 
 * Endpoint to bulk-authorize all existing landing pages from the database.
 * Useful for initial setup or re-authorizing after PostHog configuration changes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getPostHogDomainManager } from '@/lib/analytics/domainAuthorization';

export const dynamic = 'force-dynamic';

interface LandingPage {
  slug: string;
  is_published: boolean;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Bulk Authorization] Starting bulk authorization process...');
    
    const manager = getPostHogDomainManager();
    
    if (!manager) {
      return NextResponse.json({
        success: false,
        error: 'PostHog domain manager not configured',
        message: 'POSTHOG_PERSONAL_API_KEY environment variable is missing',
      }, { status: 500 });
    }

    // Fetch all published landing pages
    const { data: landingPages, error } = await supabaseAdmin
      .from('published_landings')
      .select('slug, is_published')
      .eq('is_published', true);

    if (error) {
      console.error('[Bulk Authorization] Error fetching landing pages:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch landing pages',
        message: error.message,
      }, { status: 500 });
    }

    if (!landingPages || landingPages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No published landing pages found',
        data: { total: 0, authorized: 0, failed: 0 },
      });
    }

    console.log(`[Bulk Authorization] Found ${landingPages.length} published landing pages`);

    // Build URLs to authorize
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const urls = landingPages.map((page: LandingPage) => `${baseUrl}/p/${page.slug}`);

    // Also add base patterns
    const allUrls = [
      baseUrl,
      `${baseUrl}/`,
      `${baseUrl}/p/*`, // Try wildcard
      `${baseUrl}/*`, // Try wildcard
      ...urls,
    ];

    console.log(`[Bulk Authorization] Authorizing ${allUrls.length} URLs (including wildcards)...`);

    // Authorize all URLs
    const results = await manager.authorizeUrls(allUrls);

    console.log('[Bulk Authorization] Results:', {
      total: allUrls.length,
      successful: results.success.length,
      failed: results.failed.length,
    });

    return NextResponse.json({
      success: results.failed.length === 0,
      message: `Authorized ${results.success.length}/${allUrls.length} URLs`,
      data: {
        total: allUrls.length,
        landingPages: landingPages.length,
        authorized: results.success.length,
        failed: results.failed.length,
        successUrls: results.success,
        failedUrls: results.failed,
      },
    });
  } catch (error) {
    console.error('[Bulk Authorization] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Bulk authorization failed',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Just return count of pages that would be authorized
    const { data: landingPages, error } = await supabaseAdmin
      .from('published_landings')
      .select('slug, is_published', { count: 'exact' })
      .eq('is_published', true);

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch landing pages',
        message: error.message,
      }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const pageUrls = (landingPages || []).map((page: LandingPage) => `${baseUrl}/p/${page.slug}`);
    
    const allUrls = [
      baseUrl,
      `${baseUrl}/`,
      `${baseUrl}/p/*`,
      `${baseUrl}/*`,
      ...pageUrls,
    ];

    return NextResponse.json({
      success: true,
      data: {
        publishedPages: landingPages?.length || 0,
        totalUrlsToAuthorize: allUrls.length,
        urls: allUrls,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to preview bulk authorization',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * PostHog Domain Authorization API
 * 
 * Server-side API endpoint for managing PostHog Web Analytics authorized URLs.
 * Provides diagnostic information and manual authorization capabilities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPostHogDomainManager, authorizeCurrentEnvironment, authorizeLandingPageUrl } from '@/lib/analytics/domainAuthorization';

export const dynamic = 'force-dynamic';

/**
 * GET: Retrieve current authorized URLs and diagnostic info
 */
export async function GET(request: NextRequest) {
  try {
    const manager = getPostHogDomainManager();
    
    if (!manager) {
      return NextResponse.json({
        success: false,
        error: 'PostHog domain manager not configured',
        message: 'POSTHOG_PERSONAL_API_KEY environment variable is missing',
        config: {
          hasApiKey: false,
          posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        }
      }, { status: 500 });
    }

    // Get current authorized URLs
    const authorizedUrls = await manager.getCurrentAuthorizedUrls();

    return NextResponse.json({
      success: true,
      data: {
        authorizedUrls,
        count: authorizedUrls.length,
      },
      config: {
        hasApiKey: true,
        posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      }
    });
  } catch (error) {
    console.error('[API /analytics/authorize GET] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve authorized URLs',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * POST: Authorize URLs or perform authorization actions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, url, urls, slug } = body;

    const manager = getPostHogDomainManager();
    
    if (!manager) {
      return NextResponse.json({
        success: false,
        error: 'PostHog domain manager not configured',
        message: 'POSTHOG_PERSONAL_API_KEY environment variable is missing',
      }, { status: 500 });
    }

    // Handle different actions
    switch (action) {
      case 'authorize_url':
        if (!url) {
          return NextResponse.json({
            success: false,
            error: 'URL is required for authorize_url action',
          }, { status: 400 });
        }
        
        const singleResult = await manager.authorizeUrl(url);
        return NextResponse.json({
          success: singleResult,
          data: { url, authorized: singleResult },
          message: singleResult ? `URL authorized: ${url}` : `Failed to authorize URL: ${url}`,
        });

      case 'authorize_urls':
        if (!urls || !Array.isArray(urls)) {
          return NextResponse.json({
            success: false,
            error: 'URLs array is required for authorize_urls action',
          }, { status: 400 });
        }
        
        const multiResult = await manager.authorizeUrls(urls);
        return NextResponse.json({
          success: multiResult.failed.length === 0,
          data: multiResult,
          message: `Authorized ${multiResult.success.length}/${urls.length} URLs`,
        });

      case 'authorize_environment':
        const envResult = await authorizeCurrentEnvironment();
        return NextResponse.json({
          success: envResult,
          message: envResult ? 'Environment authorized' : 'Failed to authorize environment',
        });

      case 'authorize_landing':
        if (!slug) {
          return NextResponse.json({
            success: false,
            error: 'Slug is required for authorize_landing action',
          }, { status: 400 });
        }
        
        const landingResult = await authorizeLandingPageUrl(slug);
        return NextResponse.json({
          success: landingResult,
          data: { 
            slug, 
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/p/${slug}`,
            authorized: landingResult 
          },
          message: landingResult ? `Landing page authorized: ${slug}` : `Failed to authorize landing page: ${slug}`,
        });

      case 'test_authorization':
        if (!url) {
          return NextResponse.json({
            success: false,
            error: 'URL is required for test_authorization action',
          }, { status: 400 });
        }
        
        const isAuthorized = await manager.testUrlAuthorization(url);
        return NextResponse.json({
          success: true,
          data: { url, isAuthorized },
          message: isAuthorized ? `URL is authorized: ${url}` : `URL is NOT authorized: ${url}`,
        });

      case 'get_urls_to_authorize':
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const urlsToAuth = manager.getUrlsToAuthorize(baseUrl, true);
        return NextResponse.json({
          success: true,
          data: { urls: urlsToAuth },
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: 'Supported actions: authorize_url, authorize_urls, authorize_environment, authorize_landing, test_authorization, get_urls_to_authorize',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[API /analytics/authorize POST] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process authorization request',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

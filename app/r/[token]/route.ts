import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { nanoid } from 'nanoid';

/**
 * Email Redirect Endpoint
 * 
 * Handles clicks from email campaign links
 * Flow:
 * 1. User clicks: https://studio.vercel.app/r/abc123_john
 * 2. Looks up token in database
 * 3. Generates visitor_id and session_id
 * 4. Logs email_click event
 * 5. Updates token click stats
 * 6. Redirects to landing page with tracking params
 * 
 * Security:
 * - Rate limiting to prevent token enumeration
 * - Expired tokens are rejected
 * - Invalid tokens redirect to homepage
 */

// Rate limiting for token lookups (prevent brute-force)
const tokenLookupRateLimit = new Map<string, { count: number; timestamp: number }>();
const TOKEN_RATE_LIMIT_MAX = 10;  // Max 10 attempts per IP per minute
const TOKEN_RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Cleanup rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenLookupRateLimit.entries()) {
    if (now - value.timestamp > TOKEN_RATE_LIMIT_WINDOW_MS) {
      tokenLookupRateLimit.delete(key);
    }
  }
}, TOKEN_RATE_LIMIT_WINDOW_MS);

function checkTokenRateLimit(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const now = Date.now();
  const entry = tokenLookupRateLimit.get(ip);
  
  if (!entry || now - entry.timestamp > TOKEN_RATE_LIMIT_WINDOW_MS) {
    tokenLookupRateLimit.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  if (entry.count >= TOKEN_RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Type definitions for Supabase query results
interface TokenQueryResult {
  id: string;
  token: string;
  click_count: number;
  first_clicked_at: string | null;
  expires_at: string;
  contact: {
    id: string;
    email: string;
    full_name: string;
    company_name: string;
  } | null;
  campaign: {
    id: string;
    name: string;
  } | null;
  landing_page: {
    id: string;
    page_url_key: string;
  } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  
  // Rate limit check to prevent token enumeration
  if (!checkTokenRateLimit(request)) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Validate token format (should be 8 chars + underscore + name)
  if (!token || token.length < 3 || token.length > 100) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    // 1. Lookup token in database with all related data
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('landing_page_token')
      .select(`
        id,
        token,
        click_count,
        first_clicked_at,
        expires_at,
        contact:contacts (
          id,
          email,
          full_name,
          company_name
        ),
        campaign:sl_campaigns (
          id,
          name
        ),
        landing_page:landing_pages (
          id,
          page_url_key
        )
      `)
      .eq('token', token)
      .single();

    // Invalid or expired token
    if (tokenError || !tokenData) {
      console.error('Token not found:', token, tokenError);
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Extract nested objects (Supabase returns arrays for relations, but .single() gives us one record)
    // Cast through unknown because Supabase types don't match our interface
    const contactArray = tokenData.contact as unknown as TokenQueryResult['contact'][];
    const campaignArray = tokenData.campaign as unknown as TokenQueryResult['campaign'][];
    const landingPageArray = tokenData.landing_page as unknown as TokenQueryResult['landing_page'][];
    
    const contact = Array.isArray(contactArray) ? contactArray[0] : contactArray as TokenQueryResult['contact'];
    const campaign = Array.isArray(campaignArray) ? campaignArray[0] : campaignArray as TokenQueryResult['campaign'];
    const landingPage = Array.isArray(landingPageArray) ? landingPageArray[0] : landingPageArray as TokenQueryResult['landing_page'];

    // Check if token is expired
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      console.error('Token expired:', token);
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. Generate tracking IDs
    const visitorId = `v_${nanoid(12)}`;
    const sessionId = `s_${nanoid(12)}`;

    // 3. Log email_click event
    const { error: eventError } = await supabaseAdmin
      .from('landing_page_events')
      .insert({
        event_type: 'email_click',
        visitor_id: visitorId,
        session_id: sessionId,
        contact_id: contact?.id,
        full_name: contact?.full_name,
        campaign_id: campaign?.id,
        landing_page_id: landingPage?.id,
        landing_page_slug: landingPage?.page_url_key,
        attribution_source: 'email_redirect',
        attribution_confidence: 1.0,
        user_agent: request.headers.get('user-agent') || undefined,
        referrer: request.headers.get('referer') || undefined,
        ip_subnet: getIpSubnet(request),
        metadata: {
          token: token,
          campaign_name: campaign?.name,
          contact_email: contact?.email,
          contact_company: contact?.company_name,
        },
      });

    if (eventError) {
      console.error('Failed to log email_click event:', eventError);
    }

    // 4. Update token click statistics
    const { error: updateError } = await supabaseAdmin
      .from('landing_page_token')
      .update({
        click_count: (tokenData.click_count || 0) + 1,
        first_clicked_at: tokenData.first_clicked_at || new Date().toISOString(),
        last_clicked_at: new Date().toISOString(),
      })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error('Failed to update token stats:', updateError);
    }

    // 5. Create or update visitor record
    await supabaseAdmin
      .from('landing_page_visitors')
      .upsert(
        {
          visitor_id: visitorId,
          contact_id: contact?.id,
          email: contact?.email,
          name: contact?.full_name,
          company: contact?.company_name,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          total_page_views: 0,
          total_events: 1,
        },
        {
          onConflict: 'visitor_id',
          ignoreDuplicates: false,
        }
      );

    // 6. Build redirect URL with tracking parameters
    const landingPageSlug = landingPage?.page_url_key || 'demo';
    const redirectUrl = new URL(`/p/${landingPageSlug}`, request.url);
    
    // Add tracking parameters
    redirectUrl.searchParams.set('r', token);
    redirectUrl.searchParams.set('vid', visitorId);
    redirectUrl.searchParams.set('sid', sessionId);

    // 7. Redirect to landing page
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in redirect endpoint:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

/**
 * Extract IP subnet for privacy (only first 3 octets)
 * e.g., 192.168.1.xxx
 */
function getIpSubnet(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp;
  
  if (!ip) return undefined;
  
  // Only store subnet for IPv4 (first 3 octets)
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  
  // For IPv6, just return undefined (or implement proper IPv6 subnet if needed)
  return undefined;
}

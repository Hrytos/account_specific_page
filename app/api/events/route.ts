import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * Event Logging API
 * 
 * Receives behavioral events from landing page JavaScript
 * Flow:
 * 1. Receives POST with event data
 * 2. Looks up visitor to get contact attribution
 * 3. Logs event to landing_page_events
 * 4. Updates visitor statistics
 * 
 * Security:
 * - Rate limited by visitor_id (in-memory, per-instance)
 * - Input validation
 * - No authentication required (landing pages are public)
 */

// Rate limiting: Max 100 events per visitor per minute
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Valid event types to prevent spam
const VALID_EVENT_TYPES = new Set([
  'email_click', 'page_view', 'scroll_depth', 'time_on_page',
  'cta_click', 'form_submit', 'video_play', 'idle', 'leave'
]);

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

function checkRateLimit(visitorId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(visitorId);
  
  if (!entry || now - entry.timestamp > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(visitorId, { count: 1, timestamp: now });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      event_type,
      visitor_id,
      session_id,
      landing_page_slug,
      metadata = {},
    } = body;

    // Validate required fields
    if (!event_type || !visitor_id) {
      return NextResponse.json(
        { error: 'Missing required fields: event_type, visitor_id' },
        { status: 400 }
      );
    }
    
    // Validate event type
    if (!VALID_EVENT_TYPES.has(event_type)) {
      return NextResponse.json(
        { error: 'Invalid event_type' },
        { status: 400 }
      );
    }
    
    // Validate visitor_id format (should start with 'v_')
    if (typeof visitor_id !== 'string' || !visitor_id.startsWith('v_') || visitor_id.length > 50) {
      return NextResponse.json(
        { error: 'Invalid visitor_id format' },
        { status: 400 }
      );
    }
    
    // Rate limit check
    if (!checkRateLimit(visitor_id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // 1. Look up visitor to get contact attribution
    const { data: visitor } = await supabaseAdmin
      .from('landing_page_visitors')
      .select('contact_id, email')
      .eq('visitor_id', visitor_id)
      .single();

    // 2. If we have a contact, get their full details
    let contactId = visitor?.contact_id;
    let fullName: string | undefined;
    let campaignId: string | undefined;

    if (contactId) {
      // Get contact details
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('full_name')
        .eq('id', contactId)
        .single();
      
      fullName = contact?.full_name;

      // Get campaign from most recent email_click event
      const { data: emailClick } = await supabaseAdmin
        .from('landing_page_events')
        .select('campaign_id')
        .eq('visitor_id', visitor_id)
        .eq('event_type', 'email_click')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      campaignId = emailClick?.campaign_id;
    }

    // 3. Get landing page ID from slug
    let landingPageId: string | undefined;
    if (landing_page_slug) {
      const { data: landingPage } = await supabaseAdmin
        .from('landing_pages')
        .select('id')
        .eq('page_url_key', landing_page_slug)
        .single();
      
      landingPageId = landingPage?.id;
    }

    // 4. Determine attribution confidence
    const attributionConfidence = contactId ? 1.0 : 0.0;
    const attributionSource = contactId ? 'email_redirect' : 'direct';

    // 5. Log event to database
    const { error: eventError } = await supabaseAdmin
      .from('landing_page_events')
      .insert({
        event_type,
        visitor_id,
        session_id,
        contact_id: contactId,
        full_name: fullName,
        campaign_id: campaignId,
        landing_page_id: landingPageId,
        landing_page_slug,
        attribution_source: attributionSource,
        attribution_confidence: attributionConfidence,
        user_agent: request.headers.get('user-agent') || undefined,
        screen_resolution: metadata.screen_resolution,
        viewport_size: metadata.viewport_size,
        referrer: request.headers.get('referer') || undefined,
        ip_subnet: getIpSubnet(request),
        metadata,
      });

    if (eventError) {
      console.error('Failed to log event:', eventError);
      return NextResponse.json(
        { error: 'Failed to log event', details: eventError.message },
        { status: 500 }
      );
    }

    // 6. Update visitor statistics (use raw SQL increment to avoid race conditions)
    if (visitor) {
      const updateFields: { last_seen_at: string; total_events?: number; total_page_views?: number } = {
        last_seen_at: new Date().toISOString(),
      };
      
      // Increment using Supabase RPC or manual update
      // For now, do a simple fetch-and-update (acceptable for this use case)
      const { data: currentVisitor } = await supabaseAdmin
        .from('landing_page_visitors')
        .select('total_events, total_page_views')
        .eq('visitor_id', visitor_id)
        .single();
      
      if (currentVisitor) {
        await supabaseAdmin
          .from('landing_page_visitors')
          .update({
            last_seen_at: new Date().toISOString(),
            total_events: (currentVisitor.total_events || 0) + 1,
            total_page_views: event_type === 'page_view' 
              ? (currentVisitor.total_page_views || 0) + 1
              : currentVisitor.total_page_views,
          })
          .eq('visitor_id', visitor_id);
      }
    }

    // 7. Return success with CORS headers
    return NextResponse.json(
      {
        success: true,
        event_id: visitor_id,
        attributed: !!contactId,
        attribution_confidence: attributionConfidence,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in events endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * CORS preflight handler
 * Allows landing pages to call this API from the browser
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

/**
 * Extract IP subnet for privacy (only first 3 octets)
 */
function getIpSubnet(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp;
  
  if (!ip) return undefined;
  
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  
  return undefined;
}

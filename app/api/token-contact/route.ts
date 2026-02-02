import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * Token Contact Lookup API
 * 
 * Fetches contact data from a tracking token
 * Used by AnalyticsPageWrapper for PostHog person identification
 * 
 * Flow:
 * 1. Receives token from URL parameter
 * 2. Looks up token in database with contact, campaign, landing page data
 * 3. Returns complete contact profile for PostHog identification
 */

// Type definitions for Supabase query results
interface TokenQueryResult {
  id: string;
  token: string;
  tracking_url: string | null;
  expires_at: string | null;
  contact: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string;
    company_name: string;
    job_title: string | null;
    linkedin_url: string | null;
  } | null;
  campaign: {
    id: string;
    name: string;
    smartlead_campaign_id: string | null;
  } | null;
  landing_page: {
    id: string;
    page_url_key: string;
    buyer_id: string | null;
    seller_id: string | null;
  } | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Missing token parameter' },
      { status: 400 }
    );
  }

  try {
    // Lookup token with all related data
    const { data, error } = await supabaseAdmin
      .from('landing_page_token')
      .select(`
        id,
        token,
        tracking_url,
        expires_at,
        contact:contacts (
          id,
          email,
          first_name,
          last_name,
          full_name,
          company_name,
          job_title,
          linkedin_url
        ),
        campaign:sl_campaigns (
          id,
          name,
          smartlead_campaign_id
        ),
        landing_page:landing_pages (
          id,
          page_url_key,
          buyer_id,
          seller_id
        )
      `)
      .eq('token', token)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Type cast relations from Supabase
    const tokenData = data as unknown as TokenQueryResult;
    const contact = tokenData.contact;
    const campaign = tokenData.campaign;
    const landingPage = tokenData.landing_page;

    // Check if token is expired (already fetched in main query)
    if (tokenData.expires_at && new Date(tokenData.expires_at as string) < new Date()) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 410 } // 410 Gone
      );
    }

    // Return structured data for PostHog identification
    return NextResponse.json({
      token: tokenData.token,
      tracking_url: tokenData.tracking_url,
      contact: {
        id: contact?.id,
        email: contact?.email,
        first_name: contact?.first_name,
        last_name: contact?.last_name,
        full_name: contact?.full_name,
        company_name: contact?.company_name,
        job_title: contact?.job_title,
        linkedin_url: contact?.linkedin_url,
      },
      campaign: {
        id: campaign?.id,
        name: campaign?.name,
        smartlead_campaign_id: campaign?.smartlead_campaign_id,
      },
      landing_page: {
        id: landingPage?.id,
        slug: landingPage?.page_url_key,
        buyer_id: landingPage?.buyer_id,
        seller_id: landingPage?.seller_id,
      },
    });
  } catch (error) {
    console.error('Error in token-contact lookup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

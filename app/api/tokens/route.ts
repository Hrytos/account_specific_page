import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * Token List API
 * 
 * GET: Fetch all tokens for a campaign/landing page
 * Query params:
 * - campaign_id: Filter by campaign
 * - landing_page_id: Filter by landing page
 */

interface TokenWithContact {
  id: string;
  token: string;
  tracking_url: string | null;
  click_count: number;
  first_clicked_at: string | null;
  last_clicked_at: string | null;
  expires_at: string;
  contact: {
    id: string;
    email: string;
    full_name: string;
    company_name: string;
    job_title: string | null;
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaign_id');
  const landingPageId = searchParams.get('landing_page_id');

  try {
    let query = supabaseAdmin
      .from('landing_page_token')
      .select(`
        id,
        token,
        tracking_url,
        click_count,
        first_clicked_at,
        last_clicked_at,
        expires_at,
        created_at,
        contact:contacts (
          id,
          email,
          full_name,
          company_name,
          job_title
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
      .order('created_at', { ascending: false });

    // Apply filters
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    if (landingPageId) {
      query = query.eq('landing_page_id', landingPageId);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('Failed to fetch tokens:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tokens', details: error.message },
        { status: 500 }
      );
    }

    // Type cast and format response
    const tokens = (data || []).map((row: any) => {
      const contact = Array.isArray(row.contact) ? row.contact[0] : row.contact;
      const campaign = Array.isArray(row.campaign) ? row.campaign[0] : row.campaign;
      const landingPage = Array.isArray(row.landing_page) ? row.landing_page[0] : row.landing_page;

      return {
        id: row.id,
        token: row.token,
        tracking_url: row.tracking_url,
        click_count: row.click_count || 0,
        first_clicked_at: row.first_clicked_at,
        last_clicked_at: row.last_clicked_at,
        expires_at: row.expires_at,
        created_at: row.created_at,
        contact: contact ? {
          id: contact.id,
          email: contact.email,
          full_name: contact.full_name,
          company_name: contact.company_name,
          job_title: contact.job_title,
        } : null,
        campaign: campaign ? {
          id: campaign.id,
          name: campaign.name,
        } : null,
        landing_page: landingPage ? {
          id: landingPage.id,
          page_url_key: landingPage.page_url_key,
        } : null,
      };
    });

    return NextResponse.json({
      tokens,
      count: tokens.length,
    });
  } catch (error) {
    console.error('Error in tokens list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

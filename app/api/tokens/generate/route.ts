import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { nanoid } from 'nanoid';

/**
 * Bulk Token Generation API
 * 
 * Generates tracking tokens for multiple contacts when landing page is published
 * 
 * Flow:
 * 1. Receives array of contact IDs + campaign ID + landing page ID
 * 2. Checks which contacts already have tokens (reuse existing)
 * 3. Generates new tokens for contacts that don't have them
 * 4. Bulk inserts new tokens to database
 * 5. Returns all tokens with contact details
 */

// Type definitions for Supabase query results
interface TokenContactResult {
  id: string;
  token: string;
  tracking_url: string | null;
  contact: {
    id: string;
    email: string;
    full_name: string;
    company_name: string;
    job_title: string | null;
  } | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      contact_ids,
      campaign_id,
      landing_page_id,
    } = body;

    // Validate required fields
    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json(
        { error: 'contact_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!campaign_id) {
      return NextResponse.json(
        { error: 'Missing campaign_id' },
        { status: 400 }
      );
    }

    if (!landing_page_id) {
      return NextResponse.json(
        { error: 'Missing landing_page_id' },
        { status: 400 }
      );
    }

    // Get base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    // 1. Check which contacts already have tokens for this campaign + landing page
    const { data: existingTokens, error: existingError } = await supabaseAdmin
      .from('landing_page_token')
      .select('contact_id, token, tracking_url')
      .eq('campaign_id', campaign_id)
      .eq('landing_page_id', landing_page_id)
      .in('contact_id', contact_ids);

    if (existingError) {
      console.error('Failed to check existing tokens:', existingError);
      return NextResponse.json(
        { error: 'Failed to check existing tokens' },
        { status: 500 }
      );
    }

    // 2. Determine which contacts need new tokens
    const existingContactIds = new Set((existingTokens || []).map((t) => t.contact_id));
    const newContactIds = contact_ids.filter((id) => !existingContactIds.has(id));

    console.log(`Token generation: ${newContactIds.length} new, ${existingTokens?.length || 0} existing`);

    // 3. Fetch contact details for new tokens
    let newTokens: any[] = [];
    
    if (newContactIds.length > 0) {
      const { data: contacts, error: contactsError } = await supabaseAdmin
        .from('contacts')
        .select('id, email, full_name')
        .in('id', newContactIds);

      if (contactsError || !contacts) {
        console.error('Failed to fetch contacts:', contactsError);
        return NextResponse.json(
          { error: 'Failed to fetch contact details' },
          { status: 500 }
        );
      }

      // 4. Generate unique tokens for each new contact
      newTokens = contacts.map((contact) => {
        // Generate token: random_firstname (e.g., abc123_john)
        const randomPart = nanoid(8);
        const namePart = contact.email?.split('@')[0]?.toLowerCase()?.replace(/[^a-z0-9]/g, '') || 'user';
        const token = `${randomPart}_${namePart}`;
        const tracking_url = `${baseUrl}/r/${token}`;

        return {
          token,
          tracking_url,
          contact_id: contact.id,
          campaign_id,
          landing_page_id,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
          click_count: 0,
        };
      });

      // 5. Bulk insert new tokens
      const { error: insertError } = await supabaseAdmin
        .from('landing_page_token')
        .insert(newTokens);

      if (insertError) {
        console.error('Failed to insert tokens:', insertError);
        return NextResponse.json(
          { error: 'Failed to create tokens', details: insertError.message },
          { status: 500 }
        );
      }
    }

    // 6. Fetch ALL tokens (existing + new) with full contact details
    const { data: allTokens, error: allTokensError } = await supabaseAdmin
      .from('landing_page_token')
      .select(`
        id,
        token,
        tracking_url,
        contact:contacts (
          id,
          email,
          full_name,
          company_name,
          job_title
        )
      `)
      .eq('campaign_id', campaign_id)
      .eq('landing_page_id', landing_page_id)
      .in('contact_id', contact_ids);

    if (allTokensError) {
      console.error('Failed to fetch all tokens:', allTokensError);
      return NextResponse.json(
        { error: 'Failed to fetch tokens' },
        { status: 500 }
      );
    }

    // 7. Format response
    const typedTokens = (allTokens || []) as unknown as TokenContactResult[];
    const formattedTokens = typedTokens.map((t) => ({
      token: t.token,
      tracking_url: t.tracking_url,
      contact: {
        id: t.contact?.id,
        email: t.contact?.email,
        full_name: t.contact?.full_name,
        company_name: t.contact?.company_name,
        job_title: t.contact?.job_title,
      },
    }));

    return NextResponse.json({
      success: true,
      tokens: formattedTokens,
      summary: {
        total: formattedTokens.length,
        new: newTokens.length,
        existing: existingTokens?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error in token generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

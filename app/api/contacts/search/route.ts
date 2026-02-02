import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * Contact Search API
 * 
 * Powers the searchable contact multi-select in Studio
 * 
 * Flow:
 * 1. Receives search query and campaign ID
 * 2. Searches contacts by name, email, or company
 * 3. Checks which contacts already have tokens for this campaign
 * 4. Returns merged results with token status
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const campaignId = searchParams.get('campaign_id');
  const landingPageId = searchParams.get('landing_page_id');

  try {
    // 1. Search contacts by name, email, or company
    let contactsQuery = supabaseAdmin
      .from('contacts')
      .select('id, email, first_name, last_name, full_name, company_name, job_title')
      .limit(20);

    // Add search filter if query provided
    if (query && query.length > 0) {
      contactsQuery = contactsQuery.or(
        `email.ilike.%${query}%,full_name.ilike.%${query}%,company_name.ilike.%${query}%`
      );
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      console.error('Failed to search contacts:', contactsError);
      return NextResponse.json(
        { error: 'Failed to search contacts' },
        { status: 500 }
      );
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // 2. Check which contacts already have tokens for this campaign + landing page
    const contactIds = contacts.map((c) => c.id);
    let existingTokens: any[] = [];

    if (campaignId && landingPageId) {
      const { data: tokens } = await supabaseAdmin
        .from('landing_page_token')
        .select('contact_id, token, tracking_url')
        .eq('campaign_id', campaignId)
        .eq('landing_page_id', landingPageId)
        .in('contact_id', contactIds);

      existingTokens = tokens || [];
    }

    // 3. Merge data - add token status to each contact
    const results = contacts.map((contact) => {
      const existingToken = existingTokens.find(
        (t) => t.contact_id === contact.id
      );

      return {
        id: contact.id,
        email: contact.email,
        first_name: contact.first_name,
        last_name: contact.last_name,
        full_name: contact.full_name,
        company_name: contact.company_name,
        job_title: contact.job_title,
        // Token status
        hasToken: !!existingToken,
        token: existingToken?.token,
        tracking_url: existingToken?.tracking_url,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in contact search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

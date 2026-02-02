import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * Landing Pages API
 * Simple endpoint to list landing pages for testing
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageUrlKey = searchParams.get('page_url_key');
    
    // If page_url_key is specified, find that specific page
    if (pageUrlKey) {
      const { data, error } = await supabaseAdmin
        .from('landing_pages')
        .select('id, page_url_key, buyer_id, seller_id, status')
        .eq('page_url_key', pageUrlKey)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
      }

      return NextResponse.json({ landing_page: data });
    }
    
    // Otherwise return all landing pages (ordered by most recent first)
    const { data, error } = await supabaseAdmin
      .from('landing_pages')
      .select('id, page_url_key, buyer_id, seller_id, status')
      .order('published_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ landing_pages: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

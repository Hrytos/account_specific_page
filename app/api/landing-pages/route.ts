import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * Landing Pages API
 * Endpoint to list and query landing pages
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageUrlKey = searchParams.get('page_url_key');
    const id = searchParams.get('id');
    
    // If id is specified, find that specific page by ID (for edit mode)
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
      }

      return NextResponse.json({ landing_page: data });
    }
    
    // If page_url_key is specified, find that specific page
    if (pageUrlKey) {
      const { data, error } = await supabaseAdmin
        .from('landing_pages')
        .select('id, page_url_key, buyer_id, seller_id, seller_domain, status, published_at, created_at, updated_at')
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
      .select('id, page_url_key, buyer_id, seller_id, seller_domain, status, published_at, created_at, updated_at')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ landing_pages: data });
  } catch (error) {
    console.error('[GET /api/landing-pages] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

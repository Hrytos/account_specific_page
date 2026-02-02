import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * Landing Page by ID API
 * 
 * GET /api/landing-pages/[id] - Get a specific landing page
 * DELETE /api/landing-pages/[id] - Delete a landing page
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data, error } = await supabaseAdmin
      .from('landing_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ landing_page: data });
  } catch (error) {
    console.error('[GET /api/landing-pages/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid landing page ID format' }, { status: 400 });
    }

    // First check if the landing page exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('landing_pages')
      .select('id, page_url_key')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    // Delete any associated tokens first (if there's a landing_page_token table)
    try {
      await supabaseAdmin
        .from('landing_page_token')
        .delete()
        .eq('landing_page_id', id);
    } catch {
      // Ignore errors if table doesn't exist or no tokens
    }

    // Delete the landing page
    const { error: deleteError } = await supabaseAdmin
      .from('landing_pages')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[DELETE /api/landing-pages/[id]] Delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Revalidate the cache for this page
    const revalidateUrl = new URL('/api/revalidate', request.url);
    try {
      await fetch(revalidateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': process.env.REVALIDATE_SECRET || '',
        },
        body: JSON.stringify({ 
          tag: `landing:${existing.page_url_key}`,
          path: `/p/${existing.page_url_key}`
        }),
      });
    } catch {
      // Log but don't fail if revalidation fails
      console.warn('[DELETE /api/landing-pages/[id]] Revalidation failed, continuing...');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Landing page deleted successfully',
      deleted: {
        id: existing.id,
        page_url_key: existing.page_url_key
      }
    });
  } catch (error) {
    console.error('[DELETE /api/landing-pages/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

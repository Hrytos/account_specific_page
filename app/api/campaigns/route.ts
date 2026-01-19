import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * API route to fetch campaigns from sl_campaigns table
 * Used by Studio to populate campaign dropdown
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('sl_campaigns')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('[API /campaigns] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[API /campaigns] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

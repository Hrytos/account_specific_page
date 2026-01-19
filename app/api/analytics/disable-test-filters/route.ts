/**
 * Disable Test Account Filters API
 * 
 * PostHog filters out localhost events by default.
 * This endpoint disables those filters so you can see localhost events in Live Events.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com';

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'POSTHOG_PERSONAL_API_KEY not configured',
      }, { status: 500 });
    }

    console.log('[Disable Test Filters] Removing localhost filters from PostHog...');

    // Update project to remove test account filters
    const response = await fetch(`${host}/api/projects/@current/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test_account_filters: [], // Empty array = no filters
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Disable Test Filters] Failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update test filters',
        details: error,
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('[Disable Test Filters] ✓ Test account filters disabled');

    return NextResponse.json({
      success: true,
      message: 'Test account filters have been disabled. Localhost events will now appear in PostHog Live Events.',
      data: {
        test_account_filters: data.test_account_filters || [],
      },
    });
  } catch (error) {
    console.error('[Disable Test Filters] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to disable test filters',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com';

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'POSTHOG_PERSONAL_API_KEY not configured',
      }, { status: 500 });
    }

    // Get current test filters
    const response = await fetch(`${host}/api/projects/@current/`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch project settings',
      }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        test_account_filters: data.test_account_filters || [],
        filters_active: (data.test_account_filters || []).length > 0,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch test filters',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

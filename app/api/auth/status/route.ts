import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Check authentication status
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('studio_auth');
    
    return NextResponse.json({ 
      authenticated: authCookie?.value === 'authenticated'
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}

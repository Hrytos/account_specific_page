import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Get the main domain from environment or default
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') || '';

/**
 * Extract subdomain from hostname
 * Examples:
 * - adient.yourcompany.com → "adient"
 * - www.yourcompany.com → null (main domain)
 * - yourcompany.com → null (main domain)
 * - localhost:3000 → null (development)
 */
function extractSubdomain(hostname: string, mainDomain: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Skip localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    return null;
  }
  
  // Skip if it's the main domain
  if (host === mainDomain || host === `www.${mainDomain}`) {
    return null;
  }
  
  // Extract subdomain
  // Example: adient.yourcompany.com → adient
  const parts = host.split('.');
  const mainParts = mainDomain.split('.');
  
  // If more parts than main domain, first part is subdomain
  if (parts.length > mainParts.length) {
    const subdomain = parts[0];
    
    // Skip www
    if (subdomain === 'www') {
      return null;
    }
    
    return subdomain;
  }
  
  return null;
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  
  // Skip middleware for:
  // - API routes
  // - Static files
  // - Next.js internals
  // - Studio (admin area)
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/studio') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Extract subdomain
  const subdomain = extractSubdomain(hostname, MAIN_DOMAIN);
  
  // If no subdomain, continue normally
  if (!subdomain) {
    return NextResponse.next();
  }
  
  // Rewrite to dynamic route with subdomain context
  const url = request.nextUrl.clone();
  
  // If already on /p/[slug], add subdomain to search params
  if (pathname.startsWith('/p/')) {
    url.searchParams.set('_subdomain', subdomain);
    return NextResponse.rewrite(url);
  }
  
  // Otherwise, rewrite to /p/subdomain with flag
  url.pathname = `/p/${subdomain}`;
  url.searchParams.set('_subdomain', subdomain);
  url.searchParams.set('_subdomain_route', 'true');
  
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

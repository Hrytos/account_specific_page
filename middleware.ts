import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Check if user is authenticated via cookie
 */
function isAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get('studio_auth');
  return authCookie?.value === 'authenticated';
}

/**
 * Extract buyer_id and seller_domain from hostname
 * Format: {buyer_id}.{seller_domain}
 * Examples:
 * - adient.cyngn.com → { buyerId: "adient", sellerDomain: "cyngn.com" }
 * - duke.techflow.io → { buyerId: "duke", sellerDomain: "techflow.io" }
 * - localhost:3000 → null (development)
 */
function extractDomainInfo(hostname: string): { buyerId: string; sellerDomain: string } | null {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Skip localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    return null;
  }
  
  // Split into parts
  const parts = host.split('.');
  
  // Need at least 3 parts: subdomain.domain.tld (e.g., adient.cyngn.com)
  if (parts.length < 3) {
    return null;
  }
  
  // First part is buyer_id
  const buyerId = parts[0];
  
  // Skip www
  if (buyerId === 'www') {
    return null;
  }
  
  // Rest is seller_domain
  const sellerDomain = parts.slice(1).join('.');
  
  return { buyerId, sellerDomain };
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  
  // Skip middleware for:
  // - API routes (except protected ones)
  // - Static files
  // - Next.js internals
  // - Auth endpoints
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Protect home page and studio
  const protectedPaths = ['/', '/studio'];
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith('/studio')
  );
  
  if (isProtectedPath && !isAuthenticated(request)) {
    // Redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // Skip domain routing for API and Studio
  if (pathname.startsWith('/api/') || pathname.startsWith('/studio') || pathname.startsWith('/login')) {
    return NextResponse.next();
  }
  
  // Extract domain info
  const domainInfo = extractDomainInfo(hostname);
  
  // If no domain info, continue normally
  if (!domainInfo) {
    return NextResponse.next();
  }
  
  // Rewrite to dynamic route with domain context
  const url = request.nextUrl.clone();
  
  // If already on /p/[slug], add domain info to search params
  if (pathname.startsWith('/p/')) {
    url.searchParams.set('_buyer_id', domainInfo.buyerId);
    url.searchParams.set('_seller_domain', domainInfo.sellerDomain);
    return NextResponse.rewrite(url);
  }
  
  // Otherwise, rewrite to /p/buyer-domain with flag
  url.pathname = `/p/${domainInfo.buyerId}`;
  url.searchParams.set('_buyer_id', domainInfo.buyerId);
  url.searchParams.set('_seller_domain', domainInfo.sellerDomain);
  url.searchParams.set('_domain_route', 'true');
  
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

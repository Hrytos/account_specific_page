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
  
  // Skip localhost and deployment platforms
  if (
    host === 'localhost' || 
    host === '127.0.0.1' ||
    host.endsWith('.vercel.app') ||
    host.endsWith('.netlify.app') ||
    host.endsWith('.railway.app')
  ) {
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
  // - Login page (let client-side handle redirect)
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/login') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Check if path requires authentication
  const requiresAuth = 
    pathname === '/' || 
    pathname.startsWith('/studio') || 
    pathname.startsWith('/tokens');
  
  if (requiresAuth && !isAuthenticated(request)) {
    // Redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // Skip domain-based routing for studio and token management pages
  if (pathname.startsWith('/studio') || pathname.startsWith('/tokens')) {
    return NextResponse.next();
  }
  
  // Extract domain info
  const domainInfo = extractDomainInfo(hostname);
  
  // If no domain info (localhost or base domain), allow authenticated users to access dashboard
  if (!domainInfo) {
    // Authenticated users can access the dashboard (/)
    // This allows the dashboard to work on localhost and base domains
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

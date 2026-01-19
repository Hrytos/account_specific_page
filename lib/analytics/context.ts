/**
 * Analytics Context Helpers
 * 
 * Utilities for building tenant context from page props and managing
 * multi-tenant analytics context for PostHog events.
 */

// Type definitions for tenant context
export interface TenantContext {
  buyer_id: string;
  seller_id?: string;
  page_url_key: string;
  content_sha: string;
  host: string;
  route_scheme: 'A' | 'B' | 'C';
}

// Extended context with device and viewport info
export interface AnalyticsContext extends TenantContext {
  device_type?: string;
  viewport_w?: number;
  viewport_h?: number;
}

// Page props interface for public pages
export interface PageProps {
  buyer_id: string;
  seller_id?: string;
  page_url_key: string;
  content_sha: string;
}

/**
 * Build tenant context from page props and browser environment
 */
export function buildTenantContext(pageProps: PageProps): AnalyticsContext {
  // Get browser-specific information (safe for SSR)
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const device_type = typeof window !== 'undefined' ? getDeviceType() : undefined;
  const viewport_w = typeof window !== 'undefined' ? window.innerWidth : undefined;
  const viewport_h = typeof window !== 'undefined' ? window.innerHeight : undefined;

  return {
    buyer_id: pageProps.buyer_id,
    seller_id: pageProps.seller_id,
    page_url_key: pageProps.page_url_key,
    content_sha: pageProps.content_sha,
    host,
    route_scheme: 'A', // Default to Option A for now
    device_type,
    viewport_w,
    viewport_h,
  };
}

/**
 * Extract tenant context from URL params (for Option A: /p/{slug})
 */
export function extractTenantFromSlug(slug: string): Partial<TenantContext> {
  return {
    page_url_key: slug,
    route_scheme: 'A',
  };
}

/**
 * Validate that required tenant context is present
 */
export function isValidTenantContext(context: Partial<TenantContext>): context is TenantContext {
  return !!(
    context.buyer_id &&
    context.page_url_key &&
    context.content_sha &&
    context.route_scheme
  );
}

/**
 * Get device type from user agent
 */
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent)) {
    return 'mobile';
  }
  
  if (/tablet|ipad/i.test(userAgent)) {
    return 'tablet';
  }
  
  return 'desktop';
}

/**
 * Create analytics-safe properties (remove PII, sanitize)
 */
export function sanitizeAnalyticsProps<T extends Record<string, any>>(props: T): T {
  const sanitized = { ...props };
  
  // Remove any PII fields if they accidentally get included
  const piiFields = ['email', 'phone', 'firstName', 'lastName', 'address'];
  piiFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });
  
  return sanitized;
}
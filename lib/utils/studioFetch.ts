/**
 * Studio Authenticated Fetch
 * 
 * Helper for making authenticated requests to studio APIs.
 * Uses the STUDIO_PUBLISH_SECRET stored in localStorage during publish flow.
 */

const STUDIO_SECRET_KEY = 'studio_secret';

/**
 * Store the studio secret in sessionStorage (cleared when browser closes)
 */
export function setStudioSecret(secret: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STUDIO_SECRET_KEY, secret);
  }
}

/**
 * Get the stored studio secret
 */
export function getStudioSecret(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(STUDIO_SECRET_KEY);
  }
  return null;
}

/**
 * Clear the stored studio secret
 */
export function clearStudioSecret(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STUDIO_SECRET_KEY);
  }
}

/**
 * Check if user is authenticated for studio operations
 */
export function isStudioAuthenticated(): boolean {
  return !!getStudioSecret();
}

/**
 * Make an authenticated fetch request to studio APIs
 */
export async function studioFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const secret = getStudioSecret();
  
  if (!secret) {
    throw new Error('Not authenticated. Please enter the studio secret first.');
  }

  const headers = new Headers(options.headers);
  headers.set('x-studio-secret', secret);

  return fetch(url, {
    ...options,
    headers,
  });
}

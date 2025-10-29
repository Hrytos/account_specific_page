/**
 * CONTEXT FOR COPILOT — PART A (Landing Page)
 * Vimeo URL parsing utilities
 */

/**
 * Extract Vimeo video ID from various Vimeo URL formats
 * 
 * Supported formats:
 * - https://vimeo.com/123456789
 * - https://vimeo.com/channels/staffpicks/123456789
 * - https://player.vimeo.com/video/123456789
 * - https://vimeo.com/album/2838732/video/123456789
 * 
 * @param url - Vimeo URL string
 * @returns Vimeo video ID or null if not a valid Vimeo URL
 */
export function parseVimeoId(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    
    // Must be vimeo.com domain
    if (!parsed.hostname.includes('vimeo.com')) {
      return null;
    }

    // Extract ID from path
    const pathname = parsed.pathname;
    
    // Common patterns:
    // /123456789
    // /video/123456789
    // /channels/*/123456789
    // /album/*/video/123456789
    
    // Try to match numeric ID
    const matches = pathname.match(/\/(?:video\/)?(\d+)/);
    
    if (matches && matches[1]) {
      return matches[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is a Vimeo URL
 */
export function isVimeoUrl(url: string | null | undefined): boolean {
  return parseVimeoId(url) !== null;
}

/**
 * Generate Vimeo embed URL from video ID
 */
export function getVimeoEmbedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}`;
}

/**
 * Generate Vimeo embed URL from any Vimeo URL
 * Returns null if not a valid Vimeo URL
 */
export function getVimeoEmbedUrlFromUrl(url: string | null | undefined): string | null {
  const videoId = parseVimeoId(url);
  if (!videoId) return null;
  return getVimeoEmbedUrl(videoId);
}

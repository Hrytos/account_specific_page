/**
 * CONTEXT FOR COPILOT — PART A (Landing Page)
 * - We render a landing page purely from a provided JSON.
 * - No deploy or GitHub writes in Part A.
 * - Use the normalized content contract defined in PART_A_Landing_Page_Implementation_Plan.md (sections: meta, hero, benefits, options, proof, social, secondary, seller, footer).
 * - Implement strict validation: required fields, URL hygiene (https only), length caps (headline ≤90, subhead ≤220, benefit body ≤400, quote ≤300).
 * - Produce deterministic content_sha: SHA256 over stable-stringified normalized JSON.
 * - Theme via tokens: colors (primary, accent, bg, text), fonts (heading, body), enforce 4.5:1 contrast (auto-adjust text + warning flag).
 * - Components accept normalized props only; skip empty sections without leaving gaps.
 * - Studio flow: Paste → Validate → Normalize → Preview (optional draft save to landing_pages with status draft/validated).
 */

/**
 * Check if a URL uses HTTPS protocol (strict check)
 * 
 * @param url - The URL to validate
 * @returns true if URL starts with https://, false otherwise
 * 
 * @example
 * isHttpsUrl("https://example.com") // true
 * isHttpsUrl("http://example.com") // false
 * isHttpsUrl("//example.com") // false
 * isHttpsUrl("ftp://example.com") // false
 */
export function isHttpsUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Strict HTTPS check - must start with https://
  return url.trim().toLowerCase().startsWith('https://');
}

/**
 * Validate and normalize a URL
 * - Checks if URL is valid HTTPS
 * - Returns normalized URL or null if invalid
 * 
 * @param url - The URL to validate
 * @returns Normalized URL or null if invalid
 */
export function validateHttpsUrl(url: string | undefined | null): string | null {
  if (!isHttpsUrl(url)) {
    return null;
  }

  try {
    // Use URL constructor to validate structure
    const parsed = new URL(url!);
    
    // Double-check protocol (should always be https at this point)
    if (parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.toString();
  } catch {
    // Invalid URL structure
    return null;
  }
}

/**
 * Check if a URL is valid (allows HTTP or HTTPS for less strict cases)
 * 
 * @param url - The URL to check
 * @returns true if URL is valid HTTP or HTTPS
 */
export function isValidUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

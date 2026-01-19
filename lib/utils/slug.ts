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
 * Slugify a string for use in URLs
 * - Converts to lowercase
 * - Replaces non-alphanumeric characters with hyphens
 * - Collapses multiple consecutive hyphens into one
 * - Trims leading/trailing hyphens
 * 
 * Result matches: ^[a-z0-9]+(?:-[a-z0-9]+)*$
 * 
 * @example
 * slugify("Hello World!") // "hello-world"
 * slugify("Foo---Bar") // "foo-bar"
 * slugify("123 Test!!!") // "123-test"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing whitespace
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with single hyphen
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}

/**
 * Generate a suggested page URL key for a landing page
 * Format: buyer-seller-mmyy-vN (all parts slugified)
 * 
 * @example
 * suggestPageUrlKey("Acme Corp", "TechVendor Inc", "1024", 1)
 * // "acme-corp-techvendor-inc-1024-v1"
 * 
 * @param buyer - Buyer company name
 * @param seller - Seller company name
 * @param mmyy - Month/year (e.g., "1024" for October 2024)
 * @param version - Version number (integer)
 * @returns URL-safe slug matching ^[a-z0-9]+(?:-[a-z0-9]+)*$
 */
export function suggestPageUrlKey(
  buyer: string,
  seller: string,
  mmyy: string,
  version: number
): string {
  const buyerSlug = slugify(buyer);
  const sellerSlug = slugify(seller);
  const mmyySlug = slugify(mmyy);
  const versionSlug = `v${version}`;

  // Combine all parts with hyphens
  const parts = [buyerSlug, sellerSlug, mmyySlug, versionSlug].filter(Boolean);
  return parts.join('-');
}

/**
 * Validate that a slug matches the required pattern
 * Pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$
 * 
 * @param slug - The slug to validate
 * @returns true if slug is valid
 */
export function isValidSlug(slug: string): boolean {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug);
}

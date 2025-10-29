/**
 * CONTEXT FOR COPILOT — PART A (Landing Page)
 * - We render a landing page purely from a provided JSON.
 * - No deploy or GitHub writes in Part A.
 * - Use the normalized content contract defined in PART_A_Landing_Page_Implementation_Plan.md (sections: meta, hero, benefits, options, proof, social, secondary, seller, footer).
 * - Implement strict validation: required fields, URL hygiene (https only), length caps (headline ≤90, subhead ≤180, benefit body ≤400, quote ≤300).
 * - Produce deterministic content_sha: SHA256 over stable-stringified normalized JSON.
 * - Theme via tokens: colors (primary, accent, bg, text), fonts (heading, body), enforce 4.5:1 contrast (auto-adjust text + warning flag).
 * - Components accept normalized props only; skip empty sections without leaving gaps.
 * - Studio flow: Paste → Validate → Normalize → Preview (optional draft save to landing_pages with status draft/validated).
 */

import { stableStringify } from './stableStringify';
import type { NormalizedContent } from './normalized.types';

/**
 * Computes SHA256 hash of a string using the Web Crypto API
 * Available in both browser and Node.js (v15+) environments
 *
 * @param data - String to hash
 * @returns Hex-encoded SHA256 hash
 */
async function sha256(data: string): Promise<string> {
  // Encode the string as UTF-8
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Compute SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

/**
 * Computes a deterministic content hash (SHA256) for normalized landing content
 * The hash is stable across key reorderings because we use stableStringify
 *
 * This hash serves as a fingerprint for the content, useful for:
 * - Detecting content changes
 * - Cache invalidation
 * - Version tracking
 *
 * @param normalized - Normalized landing page content
 * @returns Promise resolving to hex-encoded SHA256 hash
 */
export async function computeContentSha(
  normalized: NormalizedContent
): Promise<string> {
  const stableJson = stableStringify(normalized);
  const hash = await sha256(stableJson);
  return hash;
}

/**
 * Synchronous version using a simpler hash for testing/debugging
 * NOT cryptographically secure - use computeContentSha for production
 *
 * @param normalized - Normalized landing page content
 * @returns Simple hash string
 */
export function computeContentShaSync(normalized: NormalizedContent): string {
  const stableJson = stableStringify(normalized);
  
  // Simple non-cryptographic hash for sync usage
  let hash = 0;
  for (let i = 0; i < stableJson.length; i++) {
    const char = stableJson.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16).padStart(8, '0');
}

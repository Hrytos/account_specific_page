/**
 * CONTEXT FOR COPILOT — PART B (Multi-Tenant)
 * - One repo + one Vercel project. Supabase stores published pages.
 * - Public route renders from page_content.normalized for a given key.
 * - We use On-Demand ISR: cache tags like `landing:${slug}` (or namespaced variants).
 * - Studio Publish is a server action: validate → normalize → compute contentSha → upsert → revalidate → return url.
 * - Idempotency: if same contentSha for the key, no write or revalidate.
 * - Security: secrets are server-only; revalidate requires a secret header.
 * - No versioning now; re-publish overwrites the slug. Rollback by re-publishing old JSON.
 */

import crypto from 'crypto';
import type { NormalizedContent } from '@/lib/normalize/normalized.types';

/**
 * Recursively sort object keys for deterministic JSON stringification.
 * This ensures the same content always produces the same SHA hash.
 * 
 * @param obj - Object to sort (can be nested)
 * @returns New object with sorted keys at all levels
 */
function sortObjectKeys(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  if (typeof obj === 'object') {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
      sorted[key] = sortObjectKeys(obj[key]);
    }
    
    return sorted;
  }
  
  return obj;
}

/**
 * Compute a deterministic SHA-256 hash of normalized content.
 * Used for idempotency checks during publish operations.
 * 
 * The hash is stable across:
 * - Object key order (keys are sorted recursively)
 * - Identical content structure
 * - Multiple invocations
 * 
 * @param normalized - The normalized landing page content
 * @returns A hex-encoded SHA-256 hash string
 * 
 * @example
 * const sha = computeContentSha(normalizedContent);
 * // => "a3f5c8e9d..."
 * 
 * @throws {Error} If normalized content is null or undefined
 */
export function computeContentSha(normalized: NormalizedContent): string {
  if (!normalized) {
    throw new Error('Cannot compute SHA for null or undefined content');
  }
  
  try {
    // Deep sort all keys to ensure deterministic output
    const sorted = sortObjectKeys(normalized);
    
    // Convert to stable JSON string
    const stableJson = JSON.stringify(sorted);
    
    // Compute SHA-256 hash
    const hash = crypto.createHash('sha256');
    hash.update(stableJson, 'utf8');
    
    return hash.digest('hex');
  } catch (error) {
    throw new Error(`Failed to compute content SHA: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Compare two content SHA hashes for equality.
 * Useful for idempotency checks.
 * 
 * @param sha1 - First SHA hash
 * @param sha2 - Second SHA hash
 * @returns true if hashes match, false otherwise
 */
export function compareSha(sha1: string | null | undefined, sha2: string | null | undefined): boolean {
  if (!sha1 || !sha2) return false;
  return sha1 === sha2;
}

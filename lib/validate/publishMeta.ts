/**
 * CONTEXT FOR COPILOT — PART B (Multi-Tenant)
 * Validation for publish metadata (slug, identifiers) during server action.
 */

import { z } from 'zod';

/**
 * Slug pattern for Option A (Global Slugs)
 * Format: lowercase alphanumeric with hyphens
 * Examples: "adient-cyngn-1025", "buyer-seller-0125"
 * 
 * Security: Prevents SQL injection and path traversal attacks
 * - No uppercase letters (normalizes input)
 * - No special characters except hyphens
 * - No leading/trailing hyphens
 * - No consecutive hyphens
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * MMYY pattern (month-year)
 * Examples: "1025" (October 2025), "0126" (January 2026)
 * Format: MM (01-12) + YY (00-99)
 */
const MMYY_PATTERN = /^(0[1-9]|1[0-2])\d{2}$/;

/**
 * Buyer/Seller ID pattern
 * Security: Prevents SQL injection and ensures safe identifiers
 * - Lowercase alphanumeric only
 * - Hyphens allowed (but not leading/trailing)
 * - No special characters, spaces, or Unicode
 */
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Zod schema for publish metadata validation
 */
export const PublishMetaSchema = z.object({
  page_url_key: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must not exceed 100 characters')
    .regex(SLUG_PATTERN, 'Slug must be lowercase alphanumeric with hyphens (e.g., "buyer-seller-1025")'),
  
  buyer_id: z
    .string()
    .min(1, 'buyer_id is required')
    .max(50, 'buyer_id must not exceed 50 characters')
    .regex(ID_PATTERN, 'buyer_id must be lowercase alphanumeric with hyphens')
    .trim()
    .toLowerCase(),
  
  seller_id: z
    .string()
    .min(1, 'seller_id is required')
    .max(50, 'seller_id must not exceed 50 characters')
    .regex(ID_PATTERN, 'seller_id must be lowercase alphanumeric with hyphens')
    .trim()
    .toLowerCase(),
  
  mmyy: z
    .string()
    .regex(MMYY_PATTERN, 'mmyy must be in MMYY format (e.g., "1025" for October 2025)'),
  
  buyer_name: z
    .string()
    .min(1, 'buyer_name is required')
    .max(100, 'buyer_name must not exceed 100 characters')
    .optional(),
  
  seller_name: z
    .string()
    .min(1, 'seller_name is required')
    .max(100, 'seller_name must not exceed 100 characters')
    .optional(),
});

/**
 * TypeScript type derived from schema
 */
export type PublishMeta = z.infer<typeof PublishMetaSchema>;

/**
 * Validate publish metadata
 * 
 * @param meta - The metadata to validate
 * @returns Validation result with typed data or error details
 * 
 * @example
 * const result = validatePublishMeta({
 *   page_url_key: 'adient-cyngn-1025',
 *   buyer_id: 'adient',
 *   seller_id: 'cyngn',
 *   mmyy: '1025'
 * });
 * 
 * if (result.success) {
 *   console.log(result.data.page_url_key);
 * } else {
 *   console.error(result.error.issues);
 * }
 */
export function validatePublishMeta(meta: unknown) {
  return PublishMetaSchema.safeParse(meta);
}

/**
 * Generate a slug from buyer_id, seller_id, and mmyy
 * Useful when page_url_key is not provided
 * 
 * @param buyer_id - Buyer identifier
 * @param seller_id - Seller identifier
 * @param mmyy - Month-year in MMYY format
 * @returns Generated slug in format: {buyer_id}-{seller_id}-{mmyy}
 * 
 * @example
 * generateSlug('adient', 'cyngn', '1025');
 * // => "adient-cyngn-1025"
 */
export function generateSlug(buyer_id: string, seller_id: string, mmyy: string): string {
  return `${buyer_id}-${seller_id}-${mmyy}`;
}

/**
 * Validate that the slug matches the expected format from buyer/seller/mmyy
 * 
 * @param slug - The slug to validate
 * @param buyer_id - Expected buyer ID
 * @param seller_id - Expected seller ID
 * @param mmyy - Expected MMYY
 * @returns true if slug matches expected format, false otherwise
 * 
 * @example
 * validateSlugFormat('adient-cyngn-1025', 'adient', 'cyngn', '1025');
 * // => true
 */
export function validateSlugFormat(
  slug: string,
  buyer_id: string,
  seller_id: string,
  mmyy: string
): boolean {
  const expected = generateSlug(buyer_id, seller_id, mmyy);
  return slug === expected;
}

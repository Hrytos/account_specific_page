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

import type { RawLandingContent, NormalizedContent } from '@/lib/normalize/normalized.types';
import { mapRawToNormalized } from '@/lib/normalize/mapRawToNormalized';
import { computeContentSha } from '@/lib/normalize/hash';
import {
  validateRequiredFields,
  validateUrls,
  validateTextLimits,
  checkTextWarnings,
  checkVideoHost,
  checkThemeContrast,
  LENGTH_CAPS,
} from './rules';
import { ERROR_CODES, createError, type ErrorItem, type WarningItem } from './errors';

/**
 * Result of validation and normalization
 */
export interface ValidationResult {
  /** Normalized content (null if blocking errors exist) */
  normalized: NormalizedContent | null;
  /** Content SHA256 hash (empty string if blocking errors exist) */
  contentSha: string;
  /** Blocking errors that prevent normalization */
  errors: ErrorItem[];
  /** Non-blocking warnings */
  warnings: WarningItem[];
  /** Whether validation passed (no blocking errors) */
  isValid: boolean;
}

/**
 * Truncate meta description to specified length
 * Adds ellipsis if truncated
 */
function truncateMetaDescription(description: string | undefined | null, maxLength: number = LENGTH_CAPS.META_DESCRIPTION): string | undefined {
  if (!description) return undefined;
  
  if (description.length <= maxLength) {
    return description;
  }
  
  // Truncate at word boundary when possible
  const truncated = description.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    // If we have a space near the end, use it
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Main validation and normalization function
 * 
 * This function:
 * 1. Validates required fields
 * 2. Validates URLs
 * 3. Validates text length limits
 * 4. Checks for warnings (long text, video host, contrast)
 * 5. If no blocking errors, normalizes the content
 * 6. Truncates meta description
 * 7. Computes content SHA
 * 
 * @param raw - Raw landing page JSON
 * @returns Validation result with normalized content, hash, errors, and warnings
 */
export async function validateAndNormalize(raw: any): Promise<ValidationResult> {
  const errors: ErrorItem[] = [];
  const warnings: WarningItem[] = [];

  // Basic type check
  if (!raw || typeof raw !== 'object') {
    return {
      normalized: null,
      contentSha: '',
      errors: [createError(ERROR_CODES.E_NORMALIZE, undefined, 'Invalid JSON: expected an object')],
      warnings: [],
      isValid: false,
    };
  }

  const rawContent = raw as RawLandingContent;

  // Run all validation rules
  try {
    // Blocking validations
    errors.push(...validateRequiredFields(rawContent));
    errors.push(...validateUrls(rawContent));
    errors.push(...validateTextLimits(rawContent));

    // Non-blocking warnings
    warnings.push(...checkTextWarnings(rawContent));
    warnings.push(...checkVideoHost(rawContent));
    warnings.push(...checkThemeContrast(rawContent));

    // If there are blocking errors, return early
    if (errors.length > 0) {
      return {
        normalized: null,
        contentSha: '',
        errors,
        warnings,
        isValid: false,
      };
    }

    // No blocking errors - proceed with normalization
    const normalized = mapRawToNormalized(rawContent);

    // Truncate meta description
    if (normalized.seo?.description) {
      normalized.seo.description = truncateMetaDescription(normalized.seo.description);
    }

    // Compute content hash
    const contentSha = await computeContentSha(normalized);

    return {
      normalized,
      contentSha,
      errors: [],
      warnings,
      isValid: true,
    };
  } catch (error) {
    // Unexpected error during normalization
    return {
      normalized: null,
      contentSha: '',
      errors: [
        createError(
          ERROR_CODES.E_NORMALIZE,
          undefined,
          `Normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      ],
      warnings,
      isValid: false,
    };
  }
}

/**
 * Synchronous version of validateAndNormalize (without SHA computation)
 * Useful for quick validation checks without async overhead
 */
export function validateAndNormalizeSync(raw: any): Omit<ValidationResult, 'contentSha'> & { contentSha: null } {
  const errors: ErrorItem[] = [];
  const warnings: WarningItem[] = [];

  if (!raw || typeof raw !== 'object') {
    return {
      normalized: null,
      contentSha: null,
      errors: [createError(ERROR_CODES.E_NORMALIZE, undefined, 'Invalid JSON: expected an object')],
      warnings: [],
      isValid: false,
    };
  }

  const rawContent = raw as RawLandingContent;

  try {
    errors.push(...validateRequiredFields(rawContent));
    errors.push(...validateUrls(rawContent));
    errors.push(...validateTextLimits(rawContent));
    warnings.push(...checkTextWarnings(rawContent));
    warnings.push(...checkVideoHost(rawContent));
    warnings.push(...checkThemeContrast(rawContent));

    if (errors.length > 0) {
      return {
        normalized: null,
        contentSha: null,
        errors,
        warnings,
        isValid: false,
      };
    }

    const normalized = mapRawToNormalized(rawContent);

    if (normalized.seo?.description) {
      normalized.seo.description = truncateMetaDescription(normalized.seo.description);
    }

    return {
      normalized,
      contentSha: null,
      errors: [],
      warnings,
      isValid: true,
    };
  } catch (error) {
    return {
      normalized: null,
      contentSha: null,
      errors: [
        createError(
          ERROR_CODES.E_NORMALIZE,
          undefined,
          `Normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      ],
      warnings,
      isValid: false,
    };
  }
}

// Re-export error types and utilities
export * from './errors';
export * from './rules';

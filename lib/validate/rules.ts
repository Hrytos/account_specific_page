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

import type { RawLandingContent } from '@/lib/normalize/normalized.types';
import {
  ERROR_CODES,
  WARNING_CODES,
  createError,
  createWarning,
  type ErrorItem,
  type WarningItem,
} from './errors';
import { isHttpsUrl as isHttpsUrlUtil } from '@/lib/util/url';
import { getContrastRatio, WCAG_CONTRAST } from '@/lib/util/contrast';

/**
 * LENGTH CAPS (soft targets, warnings only)
 */
export const LENGTH_CAPS = {
  HEADLINE: 90,
  SUBHEAD: 220,
  BENEFIT_BODY: 400,
  QUOTE: 300,
  META_DESCRIPTION: 160,
} as const;

/**
 * HARD LENGTH LIMITS (>20% over cap = blocking error)
 */
export const HARD_LIMITS = {
  HEADLINE: Math.ceil(LENGTH_CAPS.HEADLINE * 1.2), // 108
  SUBHEAD: Math.ceil(LENGTH_CAPS.SUBHEAD * 1.2), // 264
  BENEFIT_BODY: Math.ceil(LENGTH_CAPS.BENEFIT_BODY * 1.2), // 480
  QUOTE: Math.ceil(LENGTH_CAPS.QUOTE * 1.2), // 360
} as const;

/**
 * Check if a string is a valid HTTPS URL (uses utility)
 */
export function isHttpsUrl(url: string | null | undefined): boolean {
  return isHttpsUrlUtil(url);
}

/**
 * Check if a string is non-empty after trimming
 */
export function isNonEmpty(value: string | null | undefined): boolean {
  return !!(value && value.trim().length > 0);
}

/**
 * Validate required field presence
 */
export function validateRequiredFields(
  raw: RawLandingContent
): ErrorItem[] {
  const errors: ErrorItem[] = [];

  // Check hero headline is present
  if (!isNonEmpty(raw.biggestBusinessBenefitBuyerStatement)) {
    errors.push(createError(ERROR_CODES.E_HERO_REQ, 'biggestBusinessBenefitBuyerStatement'));
  }

  // Check at least one section exists
  const hasBenefits = (raw.highestOperationalBenefit?.benefits?.length ?? 0) > 0;
  const hasOptions = (raw.options?.length ?? 0) > 0;
  const hasProof = raw.mostRelevantProof !== undefined && raw.mostRelevantProof !== null;

  if (!hasBenefits && !hasOptions && !hasProof) {
    errors.push(createError(ERROR_CODES.E_MIN_SECTION));
  }

  return errors;
}

/**
 * Validate URL fields
 */
export function validateUrls(raw: RawLandingContent): ErrorItem[] {
  const errors: ErrorItem[] = [];

  // Meeting scheduler link (optional, but must be https if present)
  if (raw.meetingSchedulerLink && !isHttpsUrl(raw.meetingSchedulerLink)) {
    errors.push(createError(ERROR_CODES.E_URL_SCHED, 'meetingSchedulerLink'));
  }

  // Seller website (optional, but must be https if present)
  if (raw.sellerLinkWebsite && !isHttpsUrl(raw.sellerLinkWebsite)) {
    errors.push(createError(ERROR_CODES.E_URL_SELLER, 'sellerLinkWebsite'));
  }

  // Demo video link (optional, but must be https if present)
  if (raw.quickDemoLinks && !isHttpsUrl(raw.quickDemoLinks)) {
    errors.push(createError(ERROR_CODES.E_URL_VIDEO, 'quickDemoLinks'));
  }

  // Social proof links (each must be https)
  if (raw.socialProofs && raw.socialProofs.length > 0) {
    const invalidLinks = raw.socialProofs.filter((sp) => !isHttpsUrl(sp.link));
    if (invalidLinks.length > 0) {
      errors.push(createError(ERROR_CODES.E_URL_SOCIAL, 'socialProofs[].link'));
    }
  }

  return errors;
}

/**
 * Validate text length hard limits (>20% over cap)
 */
export function validateTextLimits(raw: RawLandingContent): ErrorItem[] {
  const errors: ErrorItem[] = [];

  // Hero headline
  if (
    raw.biggestBusinessBenefitBuyerStatement &&
    raw.biggestBusinessBenefitBuyerStatement.length > HARD_LIMITS.HEADLINE
  ) {
    errors.push(
      createError(
        ERROR_CODES.E_TEXT_LIMIT,
        'biggestBusinessBenefitBuyerStatement',
        `Headline exceeds hard limit of ${HARD_LIMITS.HEADLINE} characters.`
      )
    );
  }

  // Subhead
  if (raw.synopsisBusinessBenefit && raw.synopsisBusinessBenefit.length > HARD_LIMITS.SUBHEAD) {
    errors.push(
      createError(
        ERROR_CODES.E_TEXT_LIMIT,
        'synopsisBusinessBenefit',
        `Subhead exceeds hard limit of ${HARD_LIMITS.SUBHEAD} characters.`
      )
    );
  }

  // Benefit bodies
  if (raw.highestOperationalBenefit?.benefits) {
    const overLimit = raw.highestOperationalBenefit.benefits.some(
      (b) => b.content && b.content.length > HARD_LIMITS.BENEFIT_BODY
    );
    if (overLimit) {
      errors.push(
        createError(
          ERROR_CODES.E_TEXT_LIMIT,
          'highestOperationalBenefit.benefits[].content',
          `One or more benefit descriptions exceed hard limit of ${HARD_LIMITS.BENEFIT_BODY} characters.`
        )
      );
    }
  }

  // Quote
  if (
    raw.mostRelevantProof?.quote?.text &&
    raw.mostRelevantProof.quote.text.length > HARD_LIMITS.QUOTE
  ) {
    errors.push(
      createError(
        ERROR_CODES.E_TEXT_LIMIT,
        'mostRelevantProof.quote.text',
        `Quote exceeds hard limit of ${HARD_LIMITS.QUOTE} characters.`
      )
    );
  }

  return errors;
}

/**
 * Check text length warnings (over soft cap but under hard limit)
 */
export function checkTextWarnings(raw: RawLandingContent): WarningItem[] {
  const warnings: WarningItem[] = [];

  // Hero headline
  if (
    raw.biggestBusinessBenefitBuyerStatement &&
    raw.biggestBusinessBenefitBuyerStatement.length > LENGTH_CAPS.HEADLINE &&
    raw.biggestBusinessBenefitBuyerStatement.length <= HARD_LIMITS.HEADLINE
  ) {
    warnings.push(createWarning(WARNING_CODES.W_HERO_LONG, 'biggestBusinessBenefitBuyerStatement'));
  }

  // Subhead
  if (
    raw.synopsisBusinessBenefit &&
    raw.synopsisBusinessBenefit.length > LENGTH_CAPS.SUBHEAD &&
    raw.synopsisBusinessBenefit.length <= HARD_LIMITS.SUBHEAD
  ) {
    warnings.push(createWarning(WARNING_CODES.W_SUBHEAD_LONG, 'synopsisBusinessBenefit'));
  }

  // Benefit bodies
  if (raw.highestOperationalBenefit?.benefits) {
    const hasLongBenefit = raw.highestOperationalBenefit.benefits.some(
      (b) =>
        b.content &&
        b.content.length > LENGTH_CAPS.BENEFIT_BODY &&
        b.content.length <= HARD_LIMITS.BENEFIT_BODY
    );
    if (hasLongBenefit) {
      warnings.push(createWarning(WARNING_CODES.W_BENEFIT_LONG, 'highestOperationalBenefit.benefits[].content'));
    }
  }

  // Quote
  if (
    raw.mostRelevantProof?.quote?.text &&
    raw.mostRelevantProof.quote.text.length > LENGTH_CAPS.QUOTE &&
    raw.mostRelevantProof.quote.text.length <= HARD_LIMITS.QUOTE
  ) {
    warnings.push(createWarning(WARNING_CODES.W_QUOTE_LONG, 'mostRelevantProof.quote.text'));
  }

  return warnings;
}

/**
 * Check video host (warn if not Vimeo)
 */
export function checkVideoHost(raw: RawLandingContent): WarningItem[] {
  const warnings: WarningItem[] = [];

  if (raw.quickDemoLinks && isHttpsUrl(raw.quickDemoLinks)) {
    // Check if it's a Vimeo URL
    const isVimeo = raw.quickDemoLinks.toLowerCase().includes('vimeo.com');
    if (!isVimeo) {
      warnings.push(createWarning(WARNING_CODES.W_VIDEO_HOST, 'quickDemoLinks'));
    }
  }

  return warnings;
}

/**
 * Check theme color contrast (WCAG AA compliance)
 */
export function checkThemeContrast(raw: RawLandingContent): WarningItem[] {
  const warnings: WarningItem[] = [];

  // Check brand colors for WCAG AA compliance
  if (raw.brand?.colors) {
    const { bg, text } = raw.brand.colors;
    
    if (bg && text) {
      const ratio = getContrastRatio(text, bg);
      
      if (ratio !== null && ratio < WCAG_CONTRAST.AA_NORMAL) {
        warnings.push(
          createWarning(
            WARNING_CODES.W_CONTRAST,
            'brand.colors',
            `Text/background contrast ${ratio.toFixed(2)}:1 is below WCAG AA minimum (${WCAG_CONTRAST.AA_NORMAL}:1)`
          )
        );
      }
    }
  }

  return warnings;
}

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

/**
 * Error and Warning Items
 */
export interface ErrorItem {
  code: string;
  message: string;
  field?: string;
}

export interface WarningItem {
  code: string;
  message: string;
  field?: string;
}

/**
 * BLOCKING ERROR CODES
 * These prevent normalization and must be fixed before proceeding
 */
export const ERROR_CODES = {
  E_HERO_REQ: 'E-HERO-REQ',
  E_MIN_SECTION: 'E-MIN-SECTION',
  E_URL_SCHED: 'E-URL-SCHED',
  E_URL_SELLER: 'E-URL-SELLER',
  E_URL_SOCIAL: 'E-URL-SOCIAL',
  E_URL_VIDEO: 'E-URL-VIDEO',
  E_TEXT_LIMIT: 'E-TEXT-LIMIT',
  E_NORMALIZE: 'E-NORMALIZE',
} as const;

/**
 * WARNING CODES
 * These don't block normalization but should be addressed
 */
export const WARNING_CODES = {
  W_HERO_LONG: 'W-HERO-LONG',
  W_SUBHEAD_LONG: 'W-SUBHEAD-LONG',
  W_BENEFIT_LONG: 'W-BENEFIT-LONG',
  W_QUOTE_LONG: 'W-QUOTE-LONG',
  W_VIDEO_HOST: 'W-VIDEO-HOST',
  W_CONTRAST: 'W-CONTRAST',
} as const;

/**
 * ERROR MESSAGES
 * Human-readable messages for each error code
 */
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.E_HERO_REQ]: 'Hero headline is required.',
  [ERROR_CODES.E_MIN_SECTION]:
    'Provide at least one of Benefits, Options, or Proof.',
  [ERROR_CODES.E_URL_SCHED]: 'Meeting scheduler link must be a valid https URL.',
  [ERROR_CODES.E_URL_SELLER]: 'Seller website must be a valid https URL.',
  [ERROR_CODES.E_URL_SOCIAL]:
    'One or more social proof links are not valid https URLs.',
  [ERROR_CODES.E_URL_VIDEO]: 'Demo link must be a valid https URL.',
  [ERROR_CODES.E_TEXT_LIMIT]: 'Text exceeds allowed length; please shorten.',
  [ERROR_CODES.E_NORMALIZE]:
    'Could not normalize content. Check field names and structure.',
};

/**
 * WARNING MESSAGES
 * Human-readable messages for each warning code
 */
export const WARNING_MESSAGES: Record<string, string> = {
  [WARNING_CODES.W_HERO_LONG]:
    'Hero headline is quite long; consider ≤ 90 characters.',
  [WARNING_CODES.W_SUBHEAD_LONG]:
    'Subhead is quite long; consider ≤ 180 characters.',
  [WARNING_CODES.W_BENEFIT_LONG]:
    'One or more benefit descriptions are long; consider ≤ 400 characters.',
  [WARNING_CODES.W_QUOTE_LONG]: 'Quote is long; consider ≤ 300 characters.',
  [WARNING_CODES.W_VIDEO_HOST]:
    "Video host not supported for embed; we'll show a link.",
  [WARNING_CODES.W_CONTRAST]:
    "Brand colors reduce text contrast; we've auto-adjusted text color.",
};

/**
 * Helper to create an error item
 */
export function createError(
  code: string,
  field?: string,
  customMessage?: string
): ErrorItem {
  return {
    code,
    message: customMessage || ERROR_MESSAGES[code] || 'Unknown error',
    field,
  };
}

/**
 * Helper to create a warning item
 */
export function createWarning(
  code: string,
  field?: string,
  customMessage?: string
): WarningItem {
  return {
    code,
    message: customMessage || WARNING_MESSAGES[code] || 'Unknown warning',
    field,
  };
}

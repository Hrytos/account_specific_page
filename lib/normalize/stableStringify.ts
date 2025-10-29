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
 * Converts an object to a stable, deterministic JSON string
 * Keys are sorted lexicographically (alphabetically) to ensure
 * the same object structure always produces the same string,
 * regardless of the original key order
 *
 * @param obj - Any JSON-serializable object
 * @returns Deterministic JSON string with sorted keys
 */
export function stableStringify(obj: any): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }

  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    const arrayItems = obj.map((item) => stableStringify(item));
    return `[${arrayItems.join(',')}]`;
  }

  // Handle objects - sort keys lexicographically
  const sortedKeys = Object.keys(obj).sort();
  const pairs: string[] = [];

  for (const key of sortedKeys) {
    const value = obj[key];
    // Skip undefined values (they don't serialize in JSON anyway)
    if (value !== undefined) {
      const keyStr = JSON.stringify(key);
      const valueStr = stableStringify(value);
      pairs.push(`${keyStr}:${valueStr}`);
    }
  }

  return `{${pairs.join(',')}}`;
}

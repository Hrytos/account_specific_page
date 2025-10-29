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

import type { SecondaryBenefit as SecondaryBenefitType } from '@/lib/normalize/normalized.types';

export interface SecondaryBenefitProps {
  secondary?: SecondaryBenefitType;
}

/**
 * Secondary Benefit section - Additional benefit highlight
 * Skips rendering if secondary benefit is empty
 */
export function SecondaryBenefit({ secondary }: SecondaryBenefitProps) {
  if (!secondary || (!secondary.title && !secondary.body)) {
    return null;
  }

  return (
    <section className="py-20 md:py-28 bg-[#2D3E50]">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
        {secondary.title && (
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
            {secondary.title}
          </h2>
        )}

        {secondary.body && (
          <p className="text-lg text-gray-300 leading-relaxed mb-8">
            {secondary.body}
          </p>
        )}

        <button className="px-8 py-3 bg-white hover:bg-gray-100 text-[#2D3E50] font-medium rounded-md transition-colors">
          Learn More
        </button>
      </div>
    </section>
  );
}

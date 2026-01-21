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

import type { Benefits as BenefitsType } from '@/lib/normalize/normalized.types';

export interface BenefitsProps {
  benefits?: BenefitsType;
}

/**
 * Benefits section - Highlights operational benefits
 * Skips rendering if benefits are empty
 */
export function Benefits({ benefits }: BenefitsProps) {
  if (!benefits || !benefits.items || benefits.items.length === 0) {
    return null;
  }

  return (
    <section id="benefits-section" className="py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        {benefits.title && (
          <div className="mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-2">
              {benefits.title}
            </h2>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.items.map((item, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <h3 className="text-xl font-bold text-[#2C3E50] mb-4">
                {item.title}
              </h3>
              {item.body && (
                <p className="text-gray-700 leading-relaxed text-base">
                  {item.body}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

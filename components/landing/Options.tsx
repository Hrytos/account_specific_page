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

import type { Options as OptionsType } from '@/lib/normalize/normalized.types';

export interface OptionsProps {
  options?: OptionsType;
}

/**
 * Options section - Displays pricing or package options
 * Skips rendering if options are empty
 */
export function Options({ options }: OptionsProps) {
  if (!options || !options.cards || options.cards.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-normal text-gray-900 text-center mb-16">
          Choose Your Plan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {options.cards.map((card, index) => (
            <div
              key={index}
              className="bg-[#2D3E50] rounded-lg p-8"
            >
              <h3 className="text-2xl font-semibold text-white mb-4">
                {card.title}
              </h3>

              {card.description && (
                <p className="text-gray-300 leading-relaxed mb-8">
                  {card.description}
                </p>
              )}

              <button className="w-full px-6 py-3 bg-white hover:bg-gray-100 text-[#2D3E50] font-medium rounded-md transition-colors">
                Learn More
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

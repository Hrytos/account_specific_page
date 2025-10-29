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
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {benefits.title && (
          <h2 className="text-3xl md:text-4xl font-normal text-gray-900 text-center mb-16">
            {benefits.title}
          </h2>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {benefits.items.map((item, index) => (
            <div key={index} className="text-center">
              {/* Light Blue Circular Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {item.title}
              </h3>
              {item.body && (
                <p className="text-gray-600 leading-relaxed">{item.body}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

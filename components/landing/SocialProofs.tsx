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

import type { SocialProofs as SocialProofsType } from '@/lib/normalize/normalized.types';

export interface SocialProofsProps {
  social?: SocialProofsType;
}

/**
 * Social Proofs section - Display social proof items with links
 * Skips rendering if social proofs are empty
 */
export function SocialProofs({ social }: SocialProofsProps) {
  if (!social || !social.items || social.items.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-normal text-gray-900 text-center mb-16">
          Trusted by Industry Leaders
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {social.items.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
            >
              {/* Type label */}
              {item.type && (
                <div className="mb-3">
                  <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                    {item.type}
                  </span>
                </div>
              )}

              {/* Description */}
              {item.description && (
                <p className="text-gray-700 leading-relaxed mb-4">
                  {item.description}
                </p>
              )}

              {/* Link */}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Read more here
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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

  // Generate dynamic headline
  const headline = social.sellerName && social.buyerName
    ? `${social.sellerName} has helped companies like ${social.buyerName} with similar needs`
    : 'Trusted by Industry Leaders';

  return (
    <section id="social-proofs-section" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-16 leading-tight">
          {headline}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {social.items.map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 block"
            >
              {/* Type badge */}
              {item.type && (
                <div className="mb-4">
                  <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    {item.type}
                  </span>
                </div>
              )}

              {/* Description */}
              {item.description && (
                <h3 className="text-lg font-bold text-gray-900 leading-snug mb-6 min-h-[60px]">
                  {item.description}
                </h3>
              )}

              {/* Link indicator */}
              <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:text-blue-700">
                <span>Learn more</span>
                <svg
                  className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* Read More Button */}
        {social.readMoreLink && (
          <div className="mt-12 text-center">
            <a
              href={social.readMoreLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-10 py-4 bg-white hover:bg-gray-50 text-gray-900 font-bold text-lg rounded-xl border-2 border-gray-300 hover:border-blue-500 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
            >
              Read More
              <svg
                className="ml-3 w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

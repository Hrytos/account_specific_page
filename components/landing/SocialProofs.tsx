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
import { trackCtaClick } from '@/lib/analytics/hooks';

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
    <section id="social-proofs-section" className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-12 leading-tight">
          {headline}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {social.items.map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCtaClick({
                id: 'read_case_study',
                location: 'social_list',
                href: item.link,
                linkType: 'external'
              })}
              className="group bg-gray-50 hover:bg-gray-100 rounded-lg p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 block"
            >
              {/* Type badge */}
              {item.type && (
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-[#2C3E50] text-white text-xs font-bold uppercase tracking-wide rounded">
                    {item.type}
                  </span>
                </div>
              )}

              {/* Description */}
              {item.description && (
                <h3 className="text-base font-bold text-[#2C3E50] leading-snug mb-4">
                  {item.description}
                </h3>
              )}

              {/* Link indicator */}
              <div className="flex items-center text-gray-600 font-semibold text-sm group-hover:text-[#2C3E50]">
                <span>Learn more</span>
                <svg
                  className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
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
          <div className="mt-10">
            <a
              href={social.readMoreLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCtaClick({
                id: 'read_case_study',
                location: 'social_list',
                href: social.readMoreLink || '',
                linkType: 'external'
              })}
              className="inline-flex items-center px-6 py-3 bg-[#2C3E50] hover:bg-[#1a252f] text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              Read More
              <svg
                className="ml-2 w-5 h-5"
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

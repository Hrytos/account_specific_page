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

import type { SellerInfo as SellerInfoType } from '@/lib/normalize/normalized.types';
import { trackCtaClick, useHoverTelemetry } from '@/lib/analytics/hooks';

export interface SellerInfoProps {
  seller?: SellerInfoType;
}

/**
 * Seller Info section - About the vendor/seller
 * Skips rendering if seller info is empty
 */
export function SellerInfo({ seller }: SellerInfoProps) {
  if (!seller || (!seller.body && !seller.links?.primary && !seller.links?.more)) {
    return null;
  }

  // Initialize hover telemetry for CTA engagement tracking
  const hoverProps = useHoverTelemetry('seller_cta', 'seller_section');

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4 leading-tight">
              About Us
            </h2>
          </div>

          {seller.body && (
            <div>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-4xl">
                {seller.body}
              </p>
            </div>
          )}

          {seller.links?.primary && (
            <div className="pt-2">
              <a
                href={seller.links.primary}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCtaClick({
                  id: 'visit_website',
                  location: 'seller_section',
                  href: seller.links?.primary || '',
                  linkType: 'external'
                })}
                {...hoverProps}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2C3E50] hover:bg-[#1a252f] text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                Visit Our Website
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

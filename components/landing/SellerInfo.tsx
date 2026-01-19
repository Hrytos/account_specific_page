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
    <section className="py-20 md:py-28 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Side - About Us Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                About Us
              </h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
            </div>

            {seller.body && (
              <div className="prose prose-lg max-w-none">
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  {seller.body}
                </p>
              </div>
            )}

            {seller.links?.primary && (
              <div className="pt-4">
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
                  className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                >
                  Visit Our Website
                  <svg
                    className="w-6 h-6"
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

          {/* Right Side - Decorative Element / Reserved for future content */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full h-96 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-3xl shadow-2xl overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-10 right-10 w-40 h-40 bg-blue-400 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-indigo-400 rounded-full opacity-20 blur-3xl"></div>
              
              {/* Placeholder for future content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg className="w-24 h-24 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

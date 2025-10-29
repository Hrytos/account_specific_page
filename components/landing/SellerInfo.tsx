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

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-normal text-gray-900 mb-8">
          About Us
        </h2>

        {seller.body && (
          <div className="text-gray-600 leading-relaxed mb-8">
            <p>{seller.body}</p>
          </div>
        )}

        {(seller.links?.primary || seller.links?.more) && (
          <div className="flex flex-col sm:flex-row gap-4">
            {seller.links?.primary && (
              <a
                href={seller.links.primary}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-md transition-colors"
              >
                Visit Our Website
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

            {seller.links?.more && (
              <a
                href={seller.links.more}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium rounded-md transition-colors"
              >
                Learn More
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
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

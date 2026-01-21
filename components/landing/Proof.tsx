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

import type { Proof as ProofType } from '@/lib/normalize/normalized.types';

export interface ProofProps {
  proof?: ProofType;
}

/**
 * Proof section - Social proof with optional quote/testimonial
 * Skips rendering if proof is empty
 */
export function Proof({ proof }: ProofProps) {
  if (!proof) {
    return null;
  }

  const { title, summaryTitle, summaryBody, quote } = proof;

  // Skip if all content is empty
  if (!title && !summaryTitle && !summaryBody && !quote) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        {title && (
          <div className="mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-2 leading-tight">
              {title}
            </h2>
          </div>
        )}

        {/* Two-column layout: Summary on left, Quote on right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Summary */}
          {(summaryTitle || summaryBody) && (
            <div className="space-y-4">
              {summaryTitle && (
                <h3 className="text-2xl md:text-3xl font-bold text-[#2C3E50] leading-tight">
                  {summaryTitle}
                </h3>
              )}
              {summaryBody && (
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  {summaryBody}
                </p>
              )}
            </div>
          )}

          {/* Right: Quote/Testimonial */}
          {quote && quote.text && (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <blockquote className="space-y-6">
                <p className="text-base md:text-lg text-gray-800 leading-relaxed font-normal italic">
                  "{quote.text}"
                </p>

                {quote.attribution && (
                  <footer className="border-t border-gray-200 pt-4">
                    {quote.attribution.name && (
                      <cite className="block text-[#2C3E50] font-bold text-base not-italic">
                        {quote.attribution.name}
                      </cite>
                    )}
                    {(quote.attribution.role || quote.attribution.company) && (
                      <p className="text-gray-600 text-sm mt-1">
                        {[quote.attribution.role, quote.attribution.company]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    )}
                  </footer>
                )}
              </blockquote>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

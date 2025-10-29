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
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {title && (
          <h2 className="text-3xl md:text-4xl font-normal text-gray-900 text-center mb-16">
            {title}
          </h2>
        )}

        {/* Two-column layout: Summary on left, Quote on right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left: Summary */}
          {(summaryTitle || summaryBody) && (
            <div>
              {summaryTitle && (
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {summaryTitle}
                </h3>
              )}
              {summaryBody && (
                <p className="text-gray-600 leading-relaxed">
                  {summaryBody}
                </p>
              )}
            </div>
          )}

          {/* Right: Quote/Testimonial */}
          {quote && quote.text && (
            <div className="bg-white">
              <div className="relative">
                {/* Large Quotation Mark */}
                <svg
                  className="w-16 h-16 text-blue-200 mb-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>

                <blockquote>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    {quote.text}
                  </p>

                  {quote.attribution && (
                    <footer>
                      {quote.attribution.name && (
                        <cite className="block text-gray-900 font-semibold not-italic">
                          {quote.attribution.name}
                        </cite>
                      )}
                      {(quote.attribution.role || quote.attribution.company) && (
                        <p className="text-gray-600 text-sm">
                          {[quote.attribution.role, quote.attribution.company]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </footer>
                  )}
                </blockquote>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

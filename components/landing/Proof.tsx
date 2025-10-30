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
    <section className="py-20 md:py-28 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        {title && (
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {title}
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>
        )}

        {/* Two-column layout: Summary on left, Quote on right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Summary */}
          {(summaryTitle || summaryBody) && (
            <div className="space-y-6">
              {summaryTitle && (
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                  {summaryTitle}
                </h3>
              )}
              {summaryBody && (
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  {summaryBody}
                </p>
              )}
            </div>
          )}

          {/* Right: Quote/Testimonial */}
          {quote && quote.text && (
            <div className="relative bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 hover:shadow-3xl transition-shadow duration-300">
              {/* Large Quotation Mark */}
              <div className="absolute -top-5 -left-5 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              <blockquote className="relative mt-4">
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 font-normal">
                  "{quote.text}"
                </p>

                {quote.attribution && (
                  <footer className="border-t border-gray-200 pt-6">
                    {quote.attribution.name && (
                      <cite className="block text-gray-900 font-bold text-lg not-italic mb-1">
                        {quote.attribution.name}
                      </cite>
                    )}
                    {(quote.attribution.role || quote.attribution.company) && (
                      <p className="text-gray-600 text-sm font-medium">
                        {[quote.attribution.role, quote.attribution.company]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    )}
                  </footer>
                )}
              </blockquote>

              {/* Decorative elements */}
              <div className="absolute bottom-4 right-4 w-24 h-24 bg-blue-200 rounded-full opacity-20 blur-2xl"></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

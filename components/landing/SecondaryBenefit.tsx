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

import type { SecondaryBenefit as SecondaryBenefitType } from '@/lib/normalize/normalized.types';
import { trackCtaClick, useHoverTelemetry } from '@/lib/analytics/hooks';

export interface SecondaryBenefitProps {
  secondary?: SecondaryBenefitType;
}

/**
 * Secondary Benefit section - Additional benefit highlight
 * Skips rendering if secondary benefit is empty
 */
export function SecondaryBenefit({ secondary }: SecondaryBenefitProps) {
  if (!secondary || (!secondary.title && !secondary.body)) {
    return null;
  }

  // Initialize hover telemetry for CTA engagement tracking
  const hoverProps = useHoverTelemetry('secondary_cta', 'seller_section');

  const buttonText = secondary.sellerName 
    ? `Talk to ${secondary.sellerName}`
    : 'Learn More';

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.3))]"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full opacity-10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 rounded-full opacity-10 blur-3xl"></div>
      
      <div className="container relative mx-auto px-4 md:px-6 max-w-5xl">
        <div className="text-center">
          {secondary.title && (
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {secondary.title}
            </h2>
          )}

          {secondary.body && (
            <p className="text-lg md:text-xl text-blue-100 leading-relaxed max-w-3xl mx-auto mb-10">
              {secondary.body}
            </p>
          )}

          {secondary.link && (
            <a
              href={secondary.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCtaClick({
                id: 'read_case_study',
                location: 'seller_section',
                href: secondary.link || '',
                linkType: 'external'
              })}
              {...hoverProps}
              className="inline-flex items-center px-10 py-4 bg-white hover:bg-gray-50 text-blue-700 font-semibold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {buttonText}
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          )}
        </div>

        {/* Decorative line */}
        {!secondary.link && (
          <div className="mt-12 flex justify-center">
            <div className="w-24 h-1 bg-white/30 rounded-full"></div>
          </div>
        )}
      </div>
    </section>
  );
}

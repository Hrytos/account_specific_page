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
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        <div>
          {secondary.title && (
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4 leading-tight">
              {secondary.title}
            </h2>
          )}

          {secondary.body && (
            <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6">
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
              className="inline-flex items-center px-6 py-3 bg-[#2C3E50] hover:bg-[#1a252f] text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              {buttonText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

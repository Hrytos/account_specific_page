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

import type { Options as OptionsType } from '@/lib/normalize/normalized.types';
import { trackCtaClick, useHoverTelemetry } from '@/lib/analytics/hooks';

export interface OptionsProps {
  options?: OptionsType;
}

/**
 * Options section - Displays pricing or package options
 * Skips rendering if options are empty
 */
export function Options({ options }: OptionsProps) {
  if (!options || !options.cards || options.cards.length === 0) {
    return null;
  }

  // Initialize hover telemetry for CTA engagement tracking
  const hoverProps = useHoverTelemetry('options_cta', 'proof_section');

  const buttonText = options.sellerName 
    ? `Talk to ${options.sellerName}`
    : 'Learn More';

  return (
    <section id="options-section" className="py-20 md:py-28 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Dynamic title from normalized data */}
        {options.title && (
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-4">
            {options.title}
          </h2>
        )}
        
        {/* Dynamic intro text from synopsisAutomationOptions */}
        {options.intro && (
          <p className="text-center text-gray-600 text-lg mb-16 max-w-3xl mx-auto leading-relaxed">
            {options.intro}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {options.cards.map((card, index) => (
            <div
              key={index}
              className="group bg-[#2C3E50] hover:bg-[#34495E] rounded-2xl p-10 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <h3 className="text-2xl font-bold mb-6 leading-tight">
                {card.title}
              </h3>

              {card.description && (
                <p className="text-gray-300 leading-relaxed mb-8 text-base">
                  {card.description}
                </p>
              )}

              {options.meetingLink ? (
                <a
                  href={options.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCtaClick({
                    id: 'book_meeting',
                    location: 'proof_section',
                    href: options.meetingLink || '',
                    linkType: 'external'
                  })}
                  {...hoverProps}
                  className="block w-full px-8 py-4 bg-white hover:bg-gray-50 text-[#2C3E50] font-semibold rounded-xl transition-all duration-300 transform group-hover:scale-105 shadow-md hover:shadow-lg text-center"
                >
                  {buttonText}
                </a>
              ) : (
                <button className="w-full px-8 py-4 bg-white hover:bg-gray-50 text-[#2C3E50] font-semibold rounded-xl transition-all duration-300 transform group-hover:scale-105 shadow-md hover:shadow-lg">
                  {buttonText}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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

import type { Hero as HeroType } from '@/lib/normalize/normalized.types';
import { parseVimeoId, getVimeoEmbedUrl } from '@/lib/normalize/vimeo';
import { trackCtaClick, useHoverTelemetry } from '@/lib/analytics/hooks';

export interface HeroProps {
  hero: HeroType;
}

/**
 * Hero section - Main headline and CTA (contains the only H1 on the page)
 * Skips rendering if hero is empty
 */
export function Hero({ hero }: HeroProps) {
  if (!hero || !hero.headline) {
    return null;
  }

  // Initialize hover telemetry for engagement tracking
  const hoverProps = useHoverTelemetry('hero_cta', 'hero');

  const { headline, subhead, shortDescription, cta, media } = hero;
  const videoUrl = media?.videoUrl;
  const vimeoId = videoUrl ? parseVimeoId(videoUrl) : null;

  return (
    <section className="relative bg-white py-12 md:py-16 lg:py-20 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Text Content - Left Column */}
          <div className="space-y-6">
            {/* Headline - Left aligned, large and bold */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#2C3E50] leading-tight">
              {headline}
            </h1>

            {subhead && (
              <div className="space-y-4 text-base md:text-lg text-gray-700 leading-relaxed">
                {subhead.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {shortDescription && (
              <div className="text-base md:text-lg text-gray-700 leading-relaxed">
                <p>{shortDescription}</p>
              </div>
            )}

            {/* CTA Button - Prominent */}
            {cta && cta.href && (
              <div className="pt-4">
                <a
                  href={cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCtaClick({
                    id: 'book_meeting',
                    location: 'hero',
                    href: cta.href,
                    linkType: cta.href.startsWith('http') ? 'external' : 'internal'
                  })}
                  {...hoverProps}
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#2C3E50] hover:bg-[#1a252f] text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {cta.text || 'Get Started'}
                </a>
              </div>
            )}
          </div>

          {/* Video/Media - Right Column */}
          {videoUrl && (
            <div className="w-full">
              {vimeoId ? (
                <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden shadow-xl" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={getVimeoEmbedUrl(vimeoId)}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="Product video"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="bg-gray-900 rounded-lg p-12 text-center shadow-xl">
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCtaClick({
                      id: 'read_case_study',
                      location: 'hero',
                      href: videoUrl,
                      linkType: 'external'
                    })}
                    className="inline-flex items-center px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <svg className="mr-2 w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Watch Video
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

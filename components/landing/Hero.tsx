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

  const { headline, subhead, cta, media } = hero;
  const videoUrl = media?.videoUrl;
  const vimeoId = videoUrl ? parseVimeoId(videoUrl) : null;

  return (
    <section className="bg-white py-12 md:py-20">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Text Content - Left Column */}
          <div className="space-y-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-gray-900 leading-tight">
              {headline}
            </h1>

            {subhead && (
              <div className="space-y-6 text-base md:text-lg text-gray-600 leading-relaxed">
                {subhead.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            )}

            {cta && cta.href && (
              <div className="pt-2">
                <a
                  href={cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-10 py-3.5 bg-slate-700 hover:bg-slate-800 text-white font-medium text-base rounded-md transition-colors duration-200"
                >
                  {cta.text || 'Get Started'}
                </a>
              </div>
            )}
          </div>

          {/* Video/Media */}
          {videoUrl && (
            <div className="w-full">
              {vimeoId ? (
                <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden shadow-md" style={{ paddingBottom: '56.25%' }}>
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
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-md transition-colors"
                  >
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

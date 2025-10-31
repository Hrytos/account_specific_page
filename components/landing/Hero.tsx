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

  const { headline, subhead, shortDescription, cta, media } = hero;
  const videoUrl = media?.videoUrl;
  const vimeoId = videoUrl ? parseVimeoId(videoUrl) : null;

  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50 py-16 md:py-24 lg:py-32 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
      
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        {/* Headline - Centered at top */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight max-w-5xl mx-auto">
            {headline}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Text Content - Left Column */}
          <div className="space-y-8 lg:pr-8">
            {subhead && (
              <div className="space-y-4 text-lg md:text-xl text-gray-600 leading-relaxed">
                {subhead.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-gray-600">
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
          </div>

          {/* Video/Media - Right Column */}
          {videoUrl && (
            <div className="w-full">
              {vimeoId ? (
                <div className="relative w-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-900/10" style={{ paddingBottom: '56.25%' }}>
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
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-12 text-center shadow-xl ring-1 ring-gray-900/10">
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
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

        {/* CTA Buttons - Full Width Below Grid */}
        {cta && cta.href && (
          <div className="mt-12 flex items-center gap-8 flex-wrap">
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-12 py-4 bg-[#2C3E50] hover:bg-[#1a252f] text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"
            >
              {cta.text || 'Get Started'}
            </a>
            
            <button
              onClick={() => {
                const benefitsSection = document.getElementById('benefits-section');
                benefitsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-gray-700 hover:text-blue-600 font-semibold transition-all duration-200 whitespace-nowrap text-base hover:underline underline-offset-4 cursor-pointer"
            >
              Explore Benefits
            </button>
            
            <button
              onClick={() => {
                const optionsSection = document.getElementById('options-section');
                optionsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-gray-700 hover:text-blue-600 font-semibold transition-all duration-200 whitespace-nowrap text-base hover:underline underline-offset-4 cursor-pointer"
            >
              Review Automation Options
            </button>
            
            <button
              onClick={() => {
                const socialSection = document.getElementById('social-proofs-section');
                socialSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-gray-700 hover:text-blue-600 font-semibold transition-all duration-200 whitespace-nowrap text-base hover:underline underline-offset-4 cursor-pointer"
            >
              See Success Stories
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

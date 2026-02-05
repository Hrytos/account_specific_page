'use client';

/**
 * Cyngn ABM Template
 * 
 * A bespoke ABM (Account-Based Marketing) landing page template
 * optimized for Cyngn as the seller. The buyer name is dynamic.
 * 
 * Template Type: 'cyngn-abm'
 */

import { useState, useEffect, useRef, type ReactNode } from 'react';
import type { NormalizedContent } from '@/lib/normalize/normalized.types';
import { trackCtaClick, useHoverTelemetry, useCalendarTracking } from '@/lib/analytics/hooks';

export interface CyngnAbmTemplateProps {
  content: NormalizedContent;
}

// Trusted partners list (hardcoded for Cyngn)
const TRUSTED_PARTNERS = ['G&J', 'PEPSI', 'JOHN DEERE', 'ARAUCO', 'NVIDIA', 'COATS', 'U.S. CONTINENTAL'];

// Default benefit tiles (hardcoded for Cyngn ABM template)
const DEFAULT_BENEFIT_TILES = [
  {
    title: 'Productivity',
    description: 'Offload repetitive tasks and free your team to focus on what matters most.',
    icon: 'bolt',
  },
  {
    title: 'Safety',
    description: '360° obstacle and pedestrian tracking, emergency stop buttons and safety lights.',
    icon: 'shield',
  },
  {
    title: 'Efficiency',
    description: 'Easy to operate, a breeze to maintain, and can handle the biggest industrial jobs.',
    icon: 'clock',
  },
  {
    title: 'Reliability',
    description: 'Built on industry-tested Motrec vehicles to deliver consistent, error-free performance.',
    icon: 'badge',
  },
];

// Icon components for benefit tiles
function BoltIcon() {
  return (
    <svg className="w-5 h-5 text-teal-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5 text-teal-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5 text-teal-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg className="w-5 h-5 text-teal-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg className="w-10 h-10 text-teal-700 mb-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}

const ICON_MAP: Record<string, () => ReactNode> = {
  bolt: BoltIcon,
  shield: ShieldIcon,
  clock: ClockIcon,
  badge: BadgeIcon,
};

/**
 * HubSpot Meeting Embed Component
 * Renders client-side only to prevent hydration mismatch
 */
function HubSpotMeetingEmbed() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load HubSpot script after mount
    const existingScript = document.querySelector('script[src*="MeetingsEmbedCode.js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Show loading placeholder during SSR and initial mount
  if (!mounted) {
    return (
      <div 
        className="meetings-iframe-container" 
        style={{ minWidth: '312px', minHeight: '615px', height: '756px' }}
      />
    );
  }

  // Client-side: render the actual embed container
  return (
    <div 
      className="meetings-iframe-container" 
      data-src="https://meetings.hubspot.com/cseidenberg/abm?embed=true"
    />
  );
}

/**
 * Extract Vimeo video ID from URL
 */
function getVimeoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export function CyngnAbmTemplate({ content }: CyngnAbmTemplateProps) {
  const sellerName = content.hero.sellerName || 'Cyngn';
  const buyerName = content.buyersName || 'your company'; // Use from normalized content
  const meetingLink = 'https://meetings.hubspot.com/cseidenberg/abm'; // Hardcoded for Cyngn ABM template
  const videoId = getVimeoId(content.hero.media?.videoUrl);
  
  // Hover telemetry for CTAs
  const headerCtaHover = useHoverTelemetry('header_cta', 'header');
  const heroCtaHover = useHoverTelemetry('hero_cta', 'hero');
  const optionsCtaHover = useHoverTelemetry('options_cta', 'options');

  // Calendar tracking - ref for the calendar container
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  useCalendarTracking(calendarContainerRef, {
    calendarId: 'hubspot_cyngn_abm',
    calendarType: 'hubspot',
    threshold: 0.5, // Track when 50% visible
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#e6f4f8] to-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <a href="https://www.cyngn.com/" target="_blank" rel="noopener noreferrer" className="flex items-center">
              {content.brand?.logoUrl ? (
                <img 
                  src={content.brand.logoUrl} 
                  alt={sellerName} 
                  className="h-8 md:h-9 w-auto"
                />
              ) : (
                <img 
                  src="/assets/cyngn-logo-color.png" 
                  alt="Cyngn" 
                  className="h-8 md:h-9 w-auto"
                />
              )}
            </a>
            
            {/* CTA Button */}
            <a
              href="#calendar"
              onMouseEnter={headerCtaHover.onMouseEnter}
              onMouseLeave={headerCtaHover.onMouseLeave}
              onClick={() => trackCtaClick({ id: 'book_meeting', location: 'hero', href: '#calendar', linkType: 'internal' })}
              className="inline-flex items-center justify-center rounded-lg bg-teal-700 hover:bg-teal-800 text-white px-6 py-2.5 text-sm font-semibold shadow-sm transition-all duration-300"
            >
              Talk to {sellerName}
            </a>
          </div>
        </div>
      </header>

      {/* Section 1: Hero with Video */}
      <section className="pt-16 pb-12 md:pt-20 md:pb-14 bg-gradient-to-b from-gray-50 via-white to-white overflow-hidden relative">
        {/* Subtle decorative background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-slate-700 leading-tight tracking-tight mb-8">
            {content.hero.headline}
          </h1>

          {/* Two Column Grid: Text Left, Video Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6">
              {content.hero.subhead && (
                <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                  {content.hero.subhead}
                </p>
              )}

              {content.hero.shortDescription && (
                <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                  {content.hero.shortDescription}
                </p>
              )}

              <div className="mt-8">
                <a
                  href="#calendar"
                  onMouseEnter={heroCtaHover.onMouseEnter}
                  onMouseLeave={heroCtaHover.onMouseLeave}
                  onClick={() => trackCtaClick({ id: 'book_meeting', location: 'hero', href: '#calendar', linkType: 'internal' })}
                  className="inline-flex items-center justify-center rounded-lg bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 font-semibold shadow-sm transition-all duration-300"
                >
                  Talk to {sellerName}
                </a>
              </div>
            </div>

            {/* Right: Video */}
            {videoId && (
              <div className="w-full">
                <div className="relative w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="Customer Story Video"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-6 md:py-8 border-t border-b border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[11px] md:text-xs font-semibold text-slate-500 tracking-[0.25em] uppercase mb-4">
              TRUSTED BY
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 md:gap-x-14 gap-y-4">
              <img src="/assets/logo_byd_grey.png" alt="BYD" className="h-8 md:h-10 w-auto grayscale opacity-70 hover:opacity-100 transition-opacity duration-300" />
              <img src="/assets/logo_johndeere_grey.png" alt="John Deere" className="h-8 md:h-10 w-auto grayscale opacity-70 hover:opacity-100 transition-opacity duration-300" />
              <img src="/assets/logo_arauco_grey.png" alt="Arauco" className="h-8 md:h-10 w-auto grayscale opacity-70 hover:opacity-100 transition-opacity duration-300" />
              <img src="/assets/logo_nvidia_grey.png" alt="Nvidia" className="h-8 md:h-10 w-auto grayscale opacity-70 hover:opacity-100 transition-opacity duration-300" />
              <img src="/assets/logo_coats_grey3.png" alt="Coats" className="h-8 md:h-10 w-auto grayscale opacity-70 hover:opacity-100 transition-opacity duration-300" />
              <img src="/assets/motrec-logo-transparent-02.png" alt="Motrec" className="h-8 md:h-10 w-auto grayscale opacity-70 hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Benefits */}
      {content.benefits?.title && (
        <section className="pt-14 pb-12 md:pt-16 md:pb-14 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
              {/* Left Column: Title and Summary */}
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-semibold text-teal-700 leading-tight">
                  {content.benefits.title}
                </h2>
                {content.benefits.items && content.benefits.items.some(item => item.title === '__SUMMARY__') && (
                  <p className="text-lg md:text-xl text-slate-700 leading-relaxed">
                    {content.benefits.items.find(item => item.title === '__SUMMARY__')?.body}
                  </p>
                )}
              </div>

              {/* Right Column: 2x2 Feature Grid (default tiles or from data) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Show benefit items if they exist (excluding summary) */}
                {content.benefits.items && content.benefits.items.filter(item => item.title !== '__SUMMARY__').length > 0 ? (
                  content.benefits.items
                    .filter(item => item.title !== '__SUMMARY__')
                    .slice(0, 4)
                    .map((item) => (
                      <div key={item.title} className="bg-teal-50/60 border border-teal-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-base font-semibold text-slate-800 mb-2">{item.title}</h3>
                        {item.body && (
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {item.body}
                          </p>
                        )}
                      </div>
                    ))
                ) : (
                  /* Fallback to default hardcoded tiles */
                  DEFAULT_BENEFIT_TILES.map((tile) => {
                    const IconComponent = ICON_MAP[tile.icon];
                    return (
                      <div key={tile.title} className="bg-teal-50/60 border border-teal-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-2 mb-2">
                          <IconComponent />
                          <h3 className="text-base font-semibold text-slate-800">{tile.title}</h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {tile.description}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Options */}
      {content.options?.title && (
        <section className="py-14 md:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-teal-700 mb-4 leading-tight">
              {content.options.title}
            </h2>

            {content.options.intro && (
              <p className="text-slate-600 text-base md:text-lg mb-8 leading-relaxed max-w-4xl mx-auto">
                {content.options.intro}
              </p>
            )}

            {/* Single Global CTA */}
            <div className="mb-10 md:mb-12">
              <a
                href="#calendar"
                onMouseEnter={optionsCtaHover.onMouseEnter}
                onMouseLeave={optionsCtaHover.onMouseLeave}
                onClick={() => trackCtaClick({ id: 'book_meeting', location: 'proof_section', href: '#calendar', linkType: 'internal' })}
                className="inline-flex items-center px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                Talk to {sellerName}
              </a>
            </div>

            {/* Option Tiles */}
            {content.options.cards && content.options.cards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {content.options.cards.map((card, idx) => (
                  <div key={idx} className="bg-teal-50/60 border border-teal-100 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow text-center">
                    <h3 className="text-lg md:text-xl font-semibold mb-3 text-slate-800 leading-tight">
                      {card.title}
                    </h3>
                    {card.description && (
                      <p className="text-slate-600 leading-relaxed text-base">
                        {card.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Section 4: Video + Testimonial */}
      {content.proof?.quote?.text && (
        <section className="py-14 md:py-20 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-semibold text-teal-700 mb-10 md:mb-12 text-center leading-tight">
              {sellerName} has helped companies like {buyerName} with similar needs
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
              {/* Left Column: Video - Use pro  of.videoUrl if available, otherwise fall back to hero video */}
              {(() => {
                const proofVideoId = getVimeoId(content.proof?.videoUrl);
                const fallbackVideoId = videoId; // Hero video as fallback
                const displayVideoId = proofVideoId || fallbackVideoId;
                
                return displayVideoId ? (
                  <div className="relative">
                    <div className="relative w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={`https://player.vimeo.com/video/${displayVideoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
                        className="absolute top-0 left-0 w-full h-full"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title="Customer Testimonial"
                      />
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Right Column: Testimonial */}
              <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-10 shadow-sm">
                <QuoteIcon />

                <blockquote className="space-y-6">
                  <p className="text-lg md:text-xl text-slate-700 leading-relaxed">
                    "{content.proof.quote.text}"
                  </p>

                  {/* Attribution */}
                  {content.proof.quote.attribution && (
                    <footer className="border-t border-slate-100 pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <cite className="block text-slate-800 font-semibold text-base not-italic">
                            {content.proof.quote.attribution.name}
                          </cite>
                          {content.proof.quote.attribution.role && (
                            <p className="text-slate-600 text-sm mt-1">
                              {content.proof.quote.attribution.role}, {content.proof.quote.attribution.company}
                            </p>
                          )}
                        </div>
                        
                        {/* Brand Mark */}
                        <div className="flex-shrink-0 ml-4">
                          <img 
                            src="/assets/coats-logo-circle.jpg" 
                            alt="Customer Logo" 
                            className="w-14 h-14 rounded-full object-cover shadow-md"
                          />
                        </div>
                      </div>
                    </footer>
                  )}
                </blockquote>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 5: CTA Panel - Discover Your Payback Period */}
      <section id="calendar" className="pt-14 md:pt-20 pb-8 md:pb-10 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800 rounded-2xl p-8 md:p-12 shadow-xl">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-4 leading-tight text-center">
              Discover Your Payback Period
            </h2>
            <p className="text-base md:text-lg text-slate-300 leading-relaxed mb-8 text-center">
              Our team is standing by to analyze your existing workflows and model ROI and payback projections to support a data-driven case for deploying autonomy.
            </p>
            
            {/* HubSpot Meeting Embed - Client-side only to prevent hydration mismatch */}
            <div ref={calendarContainerRef} className="bg-white rounded-lg p-4">
              <HubSpotMeetingEmbed />
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: About Cyngn (Hardcoded) */}
      <section className="pt-6 pb-10 md:pt-8 md:pb-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              About Cyngn
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cyngn develops and deploys autonomous vehicle technology for industrial organizations like manufacturers and logistics companies. The Company addresses significant challenges facing industrial organizations today, such as labor shortages and costly safety incidents.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <a href="https://www.cyngn.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
              {content.brand?.logoUrl ? (
                <img 
                  src={content.brand.logoUrl} 
                  alt={sellerName} 
                  className="h-6 w-auto opacity-90 brightness-0 invert"
                />
              ) : (
                <img 
                  src="/assets/cyngn-logo-color.png" 
                  alt="Cyngn" 
                  className="h-6 w-auto opacity-90 brightness-0 invert"
                />
              )}
            </a>
            <div className="text-center md:text-right">
              <p className="text-slate-400 text-sm">
                © {new Date().getFullYear()} All rights reserved.
              </p>
              <div className="flex items-center justify-center md:justify-end gap-2 text-xs text-slate-500 mt-1">
                <span>Powered by</span>
                <a href="https://www.hrytos.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-400 hover:text-slate-300 transition-colors">
                  Hrytos
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

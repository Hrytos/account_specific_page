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

import type { Footer as FooterType } from '@/lib/normalize/normalized.types';

export interface FooterProps {
  footer?: FooterType;
  brandLogoUrl?: string | null;
}

/**
 * Footer section - Final CTA and branding
 * Always renders with at least copyright info
 */
export function Footer({ footer, brandLogoUrl }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo */}
          {brandLogoUrl && (
            <div>
              <img
                src={brandLogoUrl}
                alt="Company Logo"
                className="h-10 w-auto"
              />
            </div>
          )}

          {/* Final CTA */}
          {footer?.cta && footer.cta.href && (
            <div className="text-center">
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                Ready to Get Started?
              </h3>
              <a
                href={footer.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-md transition-colors"
              >
                {footer.cta.text || 'Get Started'}
              </a>
            </div>
          )}

          {/* Divider */}
          <div className="w-full border-t border-gray-200"></div>

          {/* Copyright and Powered by Hrytos */}
          <div className="text-center text-gray-500 text-sm space-y-1">
            <p>© {currentYear} All rights reserved.</p>
            <p className="text-xs">Powered by Hrytos</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

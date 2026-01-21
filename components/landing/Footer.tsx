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
import { trackCtaClick, useHoverTelemetry } from '@/lib/analytics/hooks';

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

  // Initialize hover telemetry for footer CTA engagement tracking
  const hoverProps = useHoverTelemetry('footer_cta', 'footer');

  return (
    <footer className="bg-[#2C3E50] text-white py-6">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
          {/* Logo */}
          {brandLogoUrl && (
            <div className="opacity-90">
              <img
                src={brandLogoUrl}
                alt="Company Logo"
                className="h-8 w-auto"
              />
            </div>
          )}

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-gray-300 text-sm">
              © {currentYear} All rights reserved.
            </p>
            <div className="flex items-center justify-center md:justify-end gap-2 text-xs text-gray-400 mt-1">
              <span>Powered by</span>
              <span className="font-semibold text-gray-200">Hrytos</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

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

'use client';

import type { NormalizedContent } from '@/lib/normalize/normalized.types';
import {
  Hero,
  Benefits,
  Options,
  Proof,
  SocialProofs,
  SecondaryBenefit,
  SellerInfo,
  Footer,
} from './index';

export interface LandingPageProps {
  content: NormalizedContent;
}

/**
 * Complete Landing Page component
 * Renders all sections from normalized content
 * Sections auto-skip if their data is empty (no visual gaps)
 * 
 * Note: Analytics wrapper is handled by the parent page component
 */
export function LandingPage({ content }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* SEO Meta - handled in page.tsx head */}
        
        <Hero hero={content.hero} />
        <Benefits benefits={content.benefits} />
        <Options options={content.options} />
        <Proof proof={content.proof} />
        <SocialProofs social={content.social} />
        <SecondaryBenefit secondary={content.secondary} />
        <SellerInfo seller={content.seller} />
        <Footer footer={content.footer} brandLogoUrl={content.brand?.logoUrl} />
      </div>
  );
}

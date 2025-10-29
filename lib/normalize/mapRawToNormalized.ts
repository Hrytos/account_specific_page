/**
 * CONTEXT FOR COPILOT — PART A (Landing Page)
 * - We render a landing page purely from a provided JSON.
 * - No deploy or GitHub writes in Part A.
 * - Use the normalized content contract defined in PART_A_Landing_Page_Implementation_Plan.md (sections: meta, hero, benefits, options, proof, social, secondary, seller, footer).
 * - Implement strict validation: required fields, URL hygiene (https only), length caps (headline ≤90, subhead ≤180, benefit body ≤400, quote ≤300).
 * - Produce deterministic content_sha: SHA256 over stable-stringified normalized JSON.
 * - Theme via tokens: colors (primary, accent, bg, text), fonts (heading, body), enforce 4.5:1 contrast (auto-adjust text + warning flag).
 * - Components accept normalized props only; skip empty sections without leaving gaps.
 * - Studio flow: Paste → Validate → Normalize → Preview (optional draft save to landing_pages with status draft/validated).
 */

import type {
  NormalizedContent,
  RawLandingContent,
  Hero,
  Benefits,
  Options,
  Proof,
  SocialProofs,
  SecondaryBenefit,
  SellerInfo,
  Footer,
  SeoMeta,
  Brand,
} from './normalized.types';

/**
 * Maps raw JSON input to normalized content structure
 * This function performs the transformation WITHOUT validation
 * Validation happens in a separate phase
 *
 * @param raw - Raw landing page JSON from seller
 * @returns Normalized content structure for rendering
 */
export function mapRawToNormalized(raw: RawLandingContent): NormalizedContent {
  // Extract and sanitize text fields
  const sanitize = (text: string | undefined | null): string | null => {
    if (!text) return null;
    return text
      .trim()
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/[""]/g, '"') // Standardize quotes
      .replace(/['']/g, "'");
  };

  // Title and headline (required field)
  const title = sanitize(raw.biggestBusinessBenefitBuyerStatement) || '';
  
  // SEO metadata
  const seo: SeoMeta = {
    description: sanitize(raw.synopsisBusinessBenefit) || undefined,
    ogImage: null, // Future enhancement
  };

  // Brand (pass through if provided)
  const brand: Brand | undefined = raw.brand
    ? {
        logoUrl: raw.brand.logoUrl || null,
        colors: raw.brand.colors || {},
        fonts: raw.brand.fonts || {},
      }
    : undefined;

  // Hero section
  const ctaHref =
    sanitize(raw.meetingSchedulerLink) ||
    sanitize(raw.sellerLinkWebsite) ||
    '';
  
  const hero: Hero = {
    headline: title,
    subhead: sanitize(raw.synopsisBusinessBenefit),
    cta: {
      text: 'Book a meeting',
      href: ctaHref,
    },
    media: {
      videoUrl: sanitize(raw.quickDemoLinks),
    },
  };

  // Benefits section
  let benefits: Benefits | undefined;
  if (raw.highestOperationalBenefit) {
    benefits = {
      title: sanitize(
        raw.highestOperationalBenefit.highestOperationalBenefitStatement
      ),
      items: raw.highestOperationalBenefit.benefits?.map((b) => ({
        title: sanitize(b.statement) || '',
        body: sanitize(b.content),
      })),
    };
  }

  // Options section
  let options: Options | undefined;
  if (raw.options && raw.options.length > 0) {
    options = {
      cards: raw.options.map((opt) => ({
        title: sanitize(opt.title) || '',
        description: sanitize(opt.description),
      })),
    };
  }

  // Proof/Case Study section
  let proof: Proof | undefined;
  if (raw.mostRelevantProof) {
    proof = {
      title: sanitize(raw.mostRelevantProof.title),
      summaryTitle: sanitize(raw.mostRelevantProof.summaryTitle),
      summaryBody: sanitize(raw.mostRelevantProof.summaryBody),
      quote: raw.mostRelevantProof.quote
        ? {
            text: sanitize(raw.mostRelevantProof.quote.text),
            attribution: {
              name: sanitize(raw.mostRelevantProof.quote.attribution?.name),
              role: sanitize(raw.mostRelevantProof.quote.attribution?.role),
              company: sanitize(
                raw.mostRelevantProof.quote.attribution?.company
              ),
            },
          }
        : undefined,
    };
  }

  // Social Proofs section
  let social: SocialProofs | undefined;
  if (raw.socialProofs && raw.socialProofs.length > 0) {
    social = {
      items: raw.socialProofs.map((sp) => ({
        type: sanitize(sp.type),
        description: sanitize(sp.description),
        link: sp.link, // Don't sanitize URLs here, validation will check them
      })),
    };
  }

  // Secondary Benefit section
  let secondary: SecondaryBenefit | undefined;
  if (
    raw.secondHighestOperationalBenefitStatement ||
    raw.secondHighestOperationalBenefitDescription
  ) {
    secondary = {
      title: sanitize(raw.secondHighestOperationalBenefitStatement),
      body: sanitize(raw.secondHighestOperationalBenefitDescription),
    };
  }

  // Seller Info section
  let seller: SellerInfo | undefined;
  if (raw.sellerDescription || raw.sellerLinkWebsite || raw.sellerLinkReadMore) {
    seller = {
      body: sanitize(raw.sellerDescription),
      links: {
        primary: sanitize(raw.sellerLinkWebsite),
        more: sanitize(raw.sellerLinkReadMore),
      },
    };
  }

  // Footer (mirrors hero CTA if present)
  const footer: Footer = {
    cta: ctaHref
      ? {
          text: 'Book a meeting',
          href: ctaHref,
        }
      : null,
  };

  // Construct normalized content
  const normalized: NormalizedContent = {
    title,
    seo,
    brand,
    hero,
    benefits,
    options,
    proof,
    social,
    secondary,
    seller,
    footer,
  };

  return normalized;
}

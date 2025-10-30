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
 * Extract buyer company name from biggestBusinessBenefitBuyerStatement
 * e.g., "Make Duke Energy's grid..." → "Duke Energy"
 * e.g., "Make Adient's manufacturing..." → "Adient"
 */
function extractBuyerName(statement: string | undefined): string | null {
  if (!statement) return null;
  
  // Match pattern: "Make [Company Name]'s ..."
  const match = statement.match(/Make\s+([^']+)'s/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract seller company name from sellerDescription
 * e.g., "Cyngn develops & deploys..." → "Cyngn"
 * e.g., "BlueGrid Energy develops..." → "BlueGrid Energy"
 */
function extractSellerName(description: string | undefined): string | null {
  if (!description) return null;
  
  // Get the first sentence and extract the company name (first 1-3 words before "develops" or similar verbs)
  const match = description.match(/^([A-Z][A-Za-z\s&]+?)(?:\s+develops|\s+provides|\s+creates|\s+builds)/);
  return match ? match[1].trim() : null;
}

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
  
  // Dynamic CTA text using seller name
  const ctaText = raw.SellersName 
    ? `Talk to ${raw.SellersName}`
    : 'Book a meeting';
  
  const hero: Hero = {
    headline: title,
    subhead: sanitize(raw.synopsisBusinessBenefit),
    shortDescription: sanitize(raw.shortDescriptionBusinessBenefit),
    cta: {
      text: ctaText,
      href: ctaHref,
    },
    media: {
      videoUrl: sanitize(raw.quickDemoLinks),
    },
    sellerName: raw.SellersName || null,
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
    // Use direct BuyersName and SellersName fields if provided, otherwise fall back to extraction
    const buyerName = raw.BuyersName || extractBuyerName(raw.biggestBusinessBenefitBuyerStatement);
    const sellerName = raw.SellersName || extractSellerName(raw.sellerDescription);
    
    // Generate title: "How can [Seller] help [Buyer] ?"
    const optionsTitle = buyerName && sellerName
      ? `How can ${sellerName} help ${buyerName} ?`
      : null;
    
    options = {
      title: sanitize(optionsTitle),
      intro: sanitize(raw.synopsisAutomationOptions),
      sellerName: sellerName || null,
      meetingLink: sanitize(raw.meetingSchedulerLink) || null,
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
      summaryBody: sanitize(raw.mostRelevantProof.summaryContent), // Use summaryContent from JSON
      quote: {
        text: sanitize(raw.mostRelevantProof.quoteContent), // Use quoteContent from JSON
        attribution: {
          name: sanitize(raw.mostRelevantProof.quoteAuthorFullname), // Use quoteAuthorFullname
          role: sanitize(raw.mostRelevantProof.quoteAuthorDesignation), // Use quoteAuthorDesignation
          company: sanitize(raw.mostRelevantProof.quoteAuthorCompany), // Use quoteAuthorCompany
        },
      },
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
      buyerName: raw.BuyersName || null,
      sellerName: raw.SellersName || null,
      readMoreLink: sanitize(raw.sellerLinkReadMore) || null,
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
      link: sanitize(raw.meetingSchedulerLink) || sanitize(raw.sellerLinkWebsite) || sanitize(raw.sellerLinkReadMore),
      sellerName: raw.SellersName || null,
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

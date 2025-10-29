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

/**
 * SEO metadata for the landing page
 */
export interface SeoMeta {
  description?: string;
  ogImage?: string | null;
}

/**
 * Brand colors for theming
 */
export interface BrandColors {
  primary?: string | null;
  accent?: string | null;
  bg?: string | null;
  text?: string | null;
}

/**
 * Brand fonts for theming
 */
export interface BrandFonts {
  heading?: string | null;
  body?: string | null;
}

/**
 * Brand configuration
 */
export interface Brand {
  logoUrl?: string | null;
  colors?: BrandColors;
  fonts?: BrandFonts;
}

/**
 * Call-to-action button
 */
export interface CTA {
  text: string;
  href: string;
}

/**
 * Media content (video, images)
 */
export interface Media {
  videoUrl?: string | null;
}

/**
 * Hero section content
 */
export interface Hero {
  headline: string;
  subhead?: string | null;
  cta?: CTA;
  media?: Media;
}

/**
 * Individual benefit item
 */
export interface BenefitItem {
  title: string;
  body?: string | null;
}

/**
 * Benefits section
 */
export interface Benefits {
  title?: string | null;
  items?: BenefitItem[];
}

/**
 * Individual option/path card
 */
export interface OptionCard {
  title: string;
  description?: string | null;
}

/**
 * Options section
 */
export interface Options {
  cards?: OptionCard[];
}

/**
 * Quote attribution
 */
export interface Attribution {
  name?: string | null;
  role?: string | null;
  company?: string | null;
}

/**
 * Customer quote
 */
export interface Quote {
  text?: string | null;
  attribution?: Attribution;
}

/**
 * Proof/case study section
 */
export interface Proof {
  title?: string | null;
  summaryTitle?: string | null;
  summaryBody?: string | null;
  quote?: Quote;
}

/**
 * Individual social proof item
 */
export interface SocialProofItem {
  type?: string | null;
  description?: string | null;
  link: string;
}

/**
 * Social proofs section
 */
export interface SocialProofs {
  items?: SocialProofItem[];
}

/**
 * Secondary benefit section
 */
export interface SecondaryBenefit {
  title?: string | null;
  body?: string | null;
}

/**
 * Seller links
 */
export interface SellerLinks {
  primary?: string | null;
  more?: string | null;
}

/**
 * Seller information section
 */
export interface SellerInfo {
  body?: string | null;
  links?: SellerLinks;
}

/**
 * Footer section
 */
export interface Footer {
  cta?: CTA | null;
}

/**
 * Complete normalized landing page content structure
 * This is the canonical format consumed by the renderer
 */
export interface NormalizedContent {
  title: string;
  seo?: SeoMeta;
  brand?: Brand;
  hero: Hero;
  benefits?: Benefits;
  options?: Options;
  proof?: Proof;
  social?: SocialProofs;
  secondary?: SecondaryBenefit;
  seller?: SellerInfo;
  footer?: Footer;
}

/**
 * Raw JSON input structure (as provided by sellers)
 */
export interface RawLandingContent {
  // Required fields
  biggestBusinessBenefitBuyerStatement: string;

  // Hero/Meta fields
  synopsisBusinessBenefit?: string;
  meetingSchedulerLink?: string;
  sellerLinkWebsite?: string;
  quickDemoLinks?: string;

  // Benefits
  highestOperationalBenefit?: {
    highestOperationalBenefitStatement?: string;
    benefits?: Array<{
      statement: string;
      content?: string;
    }>;
  };

  // Options
  options?: Array<{
    title: string;
    description?: string;
  }>;

  // Proof/Case Study
  mostRelevantProof?: {
    title?: string;
    summaryTitle?: string;
    summaryBody?: string;
    quote?: {
      text?: string;
      attribution?: {
        name?: string;
        role?: string;
        company?: string;
      };
    };
  };

  // Social Proofs
  socialProofs?: Array<{
    type?: string;
    description?: string;
    link: string;
  }>;

  // Secondary Benefit
  secondHighestOperationalBenefitStatement?: string;
  secondHighestOperationalBenefitDescription?: string;

  // Seller Info
  sellerDescription?: string;
  sellerLinkReadMore?: string;

  // Theme (optional, future)
  brand?: {
    logoUrl?: string;
    colors?: {
      primary?: string;
      accent?: string;
      bg?: string;
      text?: string;
    };
    fonts?: {
      heading?: string;
      body?: string;
    };
  };

  // Allow additional fields without strict validation
  [key: string]: any;
}

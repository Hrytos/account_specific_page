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

/**
 * Default theme colors with WCAG AA compliant contrast
 */
export const DEFAULT_COLORS = {
  primary: '#2563EB', // Blue 600
  accent: '#7C3AED', // Violet 600
  bg: '#FFFFFF', // White
  text: '#1F2937', // Gray 800
  textLight: '#6B7280', // Gray 500
  border: '#E5E7EB', // Gray 200
  success: '#10B981', // Green 500
  warning: '#F59E0B', // Amber 500
  error: '#EF4444', // Red 500
} as const;

/**
 * Default font families
 */
export const DEFAULT_FONTS = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
} as const;

/**
 * CSS custom property names for theming
 */
export const CSS_VARIABLES = {
  // Colors
  colorPrimary: '--color-primary',
  colorAccent: '--color-accent',
  colorBg: '--color-bg',
  colorText: '--color-text',
  colorTextLight: '--color-text-light',
  colorBorder: '--color-border',
  colorSuccess: '--color-success',
  colorWarning: '--color-warning',
  colorError: '--color-error',

  // Fonts
  fontHeading: '--font-heading',
  fontBody: '--font-body',
  fontMono: '--font-mono',

  // Spacing
  spacingXs: '--spacing-xs',
  spacingSm: '--spacing-sm',
  spacingMd: '--spacing-md',
  spacingLg: '--spacing-lg',
  spacingXl: '--spacing-xl',
  spacing2xl: '--spacing-2xl',

  // Border radius
  radiusSm: '--radius-sm',
  radiusMd: '--radius-md',
  radiusLg: '--radius-lg',
  radiusFull: '--radius-full',

  // Container
  containerMaxWidth: '--container-max-width',
} as const;

/**
 * Default spacing values (in rem)
 */
export const DEFAULT_SPACING = {
  xs: '0.5rem', // 8px
  sm: '1rem', // 16px
  md: '1.5rem', // 24px
  lg: '2rem', // 32px
  xl: '3rem', // 48px
  '2xl': '4rem', // 64px
} as const;

/**
 * Default border radius values
 */
export const DEFAULT_RADIUS = {
  sm: '0.25rem', // 4px
  md: '0.5rem', // 8px
  lg: '1rem', // 16px
  full: '9999px',
} as const;

/**
 * Theme configuration interface
 */
export interface ThemeConfig {
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
}

/**
 * Generate CSS custom properties from theme config
 * 
 * @param config - Theme configuration
 * @returns Object with CSS custom property names and values
 */
export function generateThemeVariables(config: ThemeConfig = {}): Record<string, string> {
  return {
    [CSS_VARIABLES.colorPrimary]: config.colors?.primary || DEFAULT_COLORS.primary,
    [CSS_VARIABLES.colorAccent]: config.colors?.accent || DEFAULT_COLORS.accent,
    [CSS_VARIABLES.colorBg]: config.colors?.bg || DEFAULT_COLORS.bg,
    [CSS_VARIABLES.colorText]: config.colors?.text || DEFAULT_COLORS.text,
    [CSS_VARIABLES.colorTextLight]: DEFAULT_COLORS.textLight,
    [CSS_VARIABLES.colorBorder]: DEFAULT_COLORS.border,
    [CSS_VARIABLES.colorSuccess]: DEFAULT_COLORS.success,
    [CSS_VARIABLES.colorWarning]: DEFAULT_COLORS.warning,
    [CSS_VARIABLES.colorError]: DEFAULT_COLORS.error,

    [CSS_VARIABLES.fontHeading]: config.fonts?.heading || DEFAULT_FONTS.heading,
    [CSS_VARIABLES.fontBody]: config.fonts?.body || DEFAULT_FONTS.body,
    [CSS_VARIABLES.fontMono]: DEFAULT_FONTS.mono,

    [CSS_VARIABLES.spacingXs]: DEFAULT_SPACING.xs,
    [CSS_VARIABLES.spacingSm]: DEFAULT_SPACING.sm,
    [CSS_VARIABLES.spacingMd]: DEFAULT_SPACING.md,
    [CSS_VARIABLES.spacingLg]: DEFAULT_SPACING.lg,
    [CSS_VARIABLES.spacingXl]: DEFAULT_SPACING.xl,
    [CSS_VARIABLES.spacing2xl]: DEFAULT_SPACING['2xl'],

    [CSS_VARIABLES.radiusSm]: DEFAULT_RADIUS.sm,
    [CSS_VARIABLES.radiusMd]: DEFAULT_RADIUS.md,
    [CSS_VARIABLES.radiusLg]: DEFAULT_RADIUS.lg,
    [CSS_VARIABLES.radiusFull]: DEFAULT_RADIUS.full,

    [CSS_VARIABLES.containerMaxWidth]: '1200px',
  };
}

/**
 * Apply theme to a DOM element via inline styles
 * 
 * @param element - DOM element to apply theme to
 * @param config - Theme configuration
 */
export function applyTheme(element: HTMLElement, config: ThemeConfig = {}): void {
  const variables = generateThemeVariables(config);
  
  Object.entries(variables).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
}

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
 * WCAG 2.0 minimum contrast ratios
 */
export const WCAG_CONTRAST = {
  AA_NORMAL: 4.5, // Normal text
  AA_LARGE: 3.0, // Large text (18pt+ or 14pt+ bold)
  AAA_NORMAL: 7.0, // Enhanced normal text
  AAA_LARGE: 4.5, // Enhanced large text
} as const;

/**
 * Parse a color string (hex or rgb) to RGB values
 * Supports: #RGB, #RRGGBB, rgb(r, g, b), rgba(r, g, b, a)
 * 
 * @param color - Color string in hex or rgb format
 * @returns Object with r, g, b values (0-255) or null if invalid
 */
export function parseColor(color: string): { r: number; g: number; b: number } | null {
  const trimmed = color.trim();

  // Hex color (#RGB or #RRGGBB)
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    
    // Short form (#RGB)
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    
    // Long form (#RRGGBB)
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    
    return null;
  }

  // RGB/RGBA format
  const rgbMatch = trimmed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return { r, g, b };
    }
  }

  return null;
}

/**
 * Calculate relative luminance for a color (WCAG formula)
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * 
 * @param rgb - RGB color object
 * @returns Relative luminance (0-1)
 */
export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  // Convert to 0-1 range
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  // Apply gamma correction
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate WCAG contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 * 
 * @param foreground - Foreground color (hex or rgb)
 * @param background - Background color (hex or rgb)
 * @returns Contrast ratio (1-21) or null if colors are invalid
 * 
 * @example
 * getContrastRatio("#000000", "#FFFFFF") // 21 (black on white)
 * getContrastRatio("#777", "#FFF") // ~4.47
 */
export function getContrastRatio(
  foreground: string,
  background: string
): number | null {
  const fg = parseColor(foreground);
  const bg = parseColor(background);

  if (!fg || !bg) {
    return null;
  }

  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);

  // Ensure l1 is the lighter color
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  // WCAG formula: (L1 + 0.05) / (L2 + 0.05)
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Ensure text color has sufficient contrast against background
 * If contrast is below 4.5:1, flip to black or white based on background luminance
 * 
 * @param background - Background color (hex or rgb)
 * @param textColor - Proposed text color (hex or rgb)
 * @param minContrast - Minimum required contrast ratio (default: 4.5)
 * @returns Object with adjusted text color and whether adjustment was made
 * 
 * @example
 * ensureReadableTextColor("#000", "#333")
 * // { text: "#FFFFFF", adjusted: true }
 * 
 * ensureReadableTextColor("#FFF", "#000")
 * // { text: "#000000", adjusted: false }
 */
export function ensureReadableTextColor(
  background: string,
  textColor: string,
  minContrast: number = WCAG_CONTRAST.AA_NORMAL
): { text: string; adjusted: boolean } {
  const currentRatio = getContrastRatio(textColor, background);

  // If current contrast is sufficient, no adjustment needed
  if (currentRatio !== null && currentRatio >= minContrast) {
    return { text: textColor, adjusted: false };
  }

  // Parse background to determine whether to use black or white text
  const bg = parseColor(background);
  if (!bg) {
    // If we can't parse background, default to black text
    return { text: '#000000', adjusted: true };
  }

  const bgLuminance = getRelativeLuminance(bg);

  // If background is dark (luminance < 0.5), use white text
  // Otherwise use black text
  const adjustedText = bgLuminance < 0.5 ? '#FFFFFF' : '#000000';

  return { text: adjustedText, adjusted: true };
}

/**
 * Check if a color combination meets WCAG AA standards
 * 
 * @param foreground - Foreground color
 * @param background - Background color
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns true if combination meets WCAG AA standards
 */
export function meetsWCAG_AA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  if (ratio === null) return false;

  const minRatio = isLargeText ? WCAG_CONTRAST.AA_LARGE : WCAG_CONTRAST.AA_NORMAL;
  return ratio >= minRatio;
}

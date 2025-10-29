/**
 * Example: Using Phase 3 Utilities
 * Demonstrates slug generation, URL validation, and contrast checking
 */

import { slugify, suggestPageUrlKey, isValidSlug } from '@/lib/util/slug';
import { isHttpsUrl, validateHttpsUrl } from '@/lib/util/url';
import {
  getContrastRatio,
  ensureReadableTextColor,
  meetsWCAG_AA,
} from '@/lib/util/contrast';
import {
  DEFAULT_COLORS,
  generateThemeVariables,
  type ThemeConfig,
} from '@/lib/theme/tokens';

/**
 * Example 1: Generate a landing page URL key
 */
export function exampleSlugGeneration() {
  console.log('🔗 Example 1: Slug Generation');
  console.log('='.repeat(50));

  // Sample inputs
  const buyer = 'Acme Corporation';
  const seller = 'TechVendor Solutions Inc.';
  const mmyy = '1024'; // October 2024
  const version = 1;

  // Generate URL key
  const urlKey = suggestPageUrlKey(buyer, seller, mmyy, version);
  console.log('\nInputs:');
  console.log('  Buyer:', buyer);
  console.log('  Seller:', seller);
  console.log('  MMYY:', mmyy);
  console.log('  Version:', version);
  console.log('\nGenerated URL Key:', urlKey);
  console.log('Valid:', isValidSlug(urlKey) ? '✅' : '❌');

  // Test edge cases
  const edgeCases = [
    'Hello World!!!',
    'Foo---Bar',
    '123 Test!!!',
    'CamelCase Text',
    'special@#$%chars',
  ];

  console.log('\nEdge Case Tests:');
  edgeCases.forEach((input) => {
    const slug = slugify(input);
    console.log(`  "${input}" → "${slug}" (${isValidSlug(slug) ? '✅' : '❌'})`);
  });

  console.log('\n' + '='.repeat(50) + '\n');
  return urlKey;
}

/**
 * Example 2: Validate URLs for security
 */
export function exampleUrlValidation() {
  console.log('🌐 Example 2: URL Validation');
  console.log('='.repeat(50));

  const testUrls = [
    'https://example.com',
    'http://example.com',
    '//example.com',
    'ftp://example.com',
    'example.com',
    'https://vimeo.com/123456789',
    'javascript:alert("xss")',
  ];

  console.log('\nURL Security Tests:');
  testUrls.forEach((url) => {
    const isSecure = isHttpsUrl(url);
    const validated = validateHttpsUrl(url);
    console.log(`\n  URL: ${url}`);
    console.log(`  HTTPS: ${isSecure ? '✅' : '❌'}`);
    console.log(`  Validated: ${validated || 'null'}`);
  });

  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example 3: Check WCAG contrast compliance
 */
export function exampleContrastChecking() {
  console.log('🎨 Example 3: Contrast Checking');
  console.log('='.repeat(50));

  const colorPairs = [
    { fg: '#000000', bg: '#FFFFFF', name: 'Black on White' },
    { fg: '#FFFFFF', bg: '#000000', name: 'White on Black' },
    { fg: '#777777', bg: '#FFFFFF', name: 'Gray on White' },
    { fg: '#2563EB', bg: '#FFFFFF', name: 'Blue on White' },
    { fg: '#FFFF00', bg: '#FFFFFF', name: 'Yellow on White (Bad)' },
    { fg: '#FFFFFF', bg: '#2563EB', name: 'White on Blue' },
  ];

  console.log('\nContrast Ratio Tests:');
  colorPairs.forEach(({ fg, bg, name }) => {
    const ratio = getContrastRatio(fg, bg);
    const meetsAA = meetsWCAG_AA(fg, bg);
    const adjusted = ensureReadableTextColor(bg, fg);

    console.log(`\n  ${name}`);
    console.log(`  Colors: ${fg} on ${bg}`);
    console.log(`  Ratio: ${ratio?.toFixed(2)}:1`);
    console.log(`  WCAG AA: ${meetsAA ? '✅ Pass' : '❌ Fail'}`);
    if (adjusted.adjusted) {
      console.log(`  Auto-adjusted to: ${adjusted.text}`);
    }
  });

  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example 4: Generate and validate theme
 */
export function exampleThemeGeneration() {
  console.log('🎭 Example 4: Theme Generation');
  console.log('='.repeat(50));

  // Custom theme config
  const customTheme: ThemeConfig = {
    colors: {
      primary: '#7C3AED', // Purple
      accent: '#10B981', // Green
      bg: '#FFFFFF',
      text: '#1F2937',
    },
    fonts: {
      heading: '"Poppins", sans-serif',
      body: '"Inter", sans-serif',
    },
  };

  // Generate CSS variables
  const variables = generateThemeVariables(customTheme);

  console.log('\nDefault Colors (WCAG AA Compliant):');
  Object.entries(DEFAULT_COLORS).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  console.log('\nCustom Theme Variables:');
  console.log('  Primary:', variables['--color-primary']);
  console.log('  Accent:', variables['--color-accent']);
  console.log('  Heading Font:', variables['--font-heading']);

  // Check contrast of custom theme
  console.log('\nCustom Theme Contrast Check:');
  const primaryOnBg = getContrastRatio(
    customTheme.colors?.primary || '',
    customTheme.colors?.bg || ''
  );
  const textOnBg = getContrastRatio(
    customTheme.colors?.text || '',
    customTheme.colors?.bg || ''
  );

  console.log(`  Primary on BG: ${primaryOnBg?.toFixed(2)}:1`);
  console.log(`  Text on BG: ${textOnBg?.toFixed(2)}:1`);

  console.log('\n' + '='.repeat(50) + '\n');
  return variables;
}

/**
 * Example 5: Complete landing page setup workflow
 */
export function exampleCompleteWorkflow() {
  console.log('🚀 Example 5: Complete Workflow');
  console.log('='.repeat(50));

  // Step 1: Generate URL key
  console.log('\n📝 Step 1: Generate URL Key');
  const urlKey = suggestPageUrlKey('Acme Corp', 'TechVendor', '1024', 1);
  console.log('  URL Key:', urlKey);

  // Step 2: Validate external URLs
  console.log('\n🔗 Step 2: Validate URLs');
  const meetingLink = 'https://calendly.com/example';
  const websiteLink = 'https://example.com';
  console.log('  Meeting Link:', isHttpsUrl(meetingLink) ? '✅' : '❌');
  console.log('  Website Link:', isHttpsUrl(websiteLink) ? '✅' : '❌');

  // Step 3: Check theme contrast
  console.log('\n🎨 Step 3: Check Theme Contrast');
  const bgColor = '#FFFFFF';
  const textColor = '#1F2937';
  const primaryColor = '#2563EB';

  const textContrast = getContrastRatio(textColor, bgColor);
  const primaryContrast = getContrastRatio(primaryColor, bgColor);

  console.log(`  Text/BG: ${textContrast?.toFixed(2)}:1 ${meetsWCAG_AA(textColor, bgColor) ? '✅' : '❌'}`);
  console.log(`  Primary/BG: ${primaryContrast?.toFixed(2)}:1 ${meetsWCAG_AA(primaryColor, bgColor) ? '✅' : '❌'}`);

  // Step 4: Auto-adjust if needed
  console.log('\n⚙️  Step 4: Auto-adjust Text if Needed');
  const badTextColor = '#CCCCCC'; // Low contrast on white
  const adjusted = ensureReadableTextColor(bgColor, badTextColor);
  console.log(`  Original: ${badTextColor}`);
  console.log(`  Adjusted: ${adjusted.text} (${adjusted.adjusted ? 'Changed' : 'No change'})`);

  console.log('\n✅ Workflow Complete!');
  console.log('='.repeat(50) + '\n');

  return {
    urlKey,
    urls: { meeting: meetingLink, website: websiteLink },
    theme: { bg: bgColor, text: textColor, primary: primaryColor },
  };
}

/**
 * Run all examples
 */
export function runAllExamples() {
  exampleSlugGeneration();
  exampleUrlValidation();
  exampleContrastChecking();
  exampleThemeGeneration();
  exampleCompleteWorkflow();
}

// Uncomment to run in Node.js or browser console:
// runAllExamples();

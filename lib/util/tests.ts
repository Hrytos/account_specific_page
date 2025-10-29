/**
 * Unit Tests for Phase 3 Utilities
 * Run these to verify slug, URL, and contrast utilities work correctly
 */

import { slugify, suggestPageUrlKey, isValidSlug } from '@/lib/util/slug';
import { isHttpsUrl, validateHttpsUrl } from '@/lib/util/url';
import {
  parseColor,
  getContrastRatio,
  ensureReadableTextColor,
  meetsWCAG_AA,
  WCAG_CONTRAST,
} from '@/lib/util/contrast';

export interface TestResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
}

/**
 * Test runner utility
 */
function test(name: string, actual: any, expected: any): TestResult {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  return { name, passed, expected, actual };
}

/**
 * Slug Tests
 */
export function testSlugify(): TestResult[] {
  return [
    test('Basic slugify', slugify('Hello World'), 'hello-world'),
    test('Special chars removed', slugify('Hello!!!World???'), 'hello-world'),
    test('Multiple hyphens collapsed', slugify('Foo---Bar'), 'foo-bar'),
    test('Trim leading/trailing hyphens', slugify('---test---'), 'test'),
    test('Numbers preserved', slugify('123 Test 456'), '123-test-456'),
    test('Already lowercase', slugify('already-lowercase'), 'already-lowercase'),
    test('Empty string', slugify(''), ''),
    test('Valid slug pattern', isValidSlug('hello-world-123'), true),
    test('Invalid: uppercase', isValidSlug('Hello-World'), false),
    test('Invalid: special chars', isValidSlug('hello_world'), false),
    test('Invalid: double hyphen', isValidSlug('hello--world'), false),
  ];
}

/**
 * URL Tests
 */
export function testUrls(): TestResult[] {
  return [
    test('Valid HTTPS', isHttpsUrl('https://example.com'), true),
    test('Invalid: HTTP', isHttpsUrl('http://example.com'), false),
    test('Invalid: protocol-relative', isHttpsUrl('//example.com'), false),
    test('Invalid: no protocol', isHttpsUrl('example.com'), false),
    test('Invalid: FTP', isHttpsUrl('ftp://example.com'), false),
    test('Invalid: null', isHttpsUrl(null), false),
    test('Invalid: undefined', isHttpsUrl(undefined), false),
    test('Invalid: empty', isHttpsUrl(''), false),
    test(
      'Validated HTTPS',
      validateHttpsUrl('https://example.com'),
      'https://example.com/'
    ),
    test('Validated HTTP (null)', validateHttpsUrl('http://example.com'), null),
  ];
}

/**
 * Color Parsing Tests
 */
export function testColorParsing(): TestResult[] {
  return [
    test('Hex short form', parseColor('#RGB'), null), // Invalid short without all 3
    test('Hex 3-char', parseColor('#F0A'), { r: 255, g: 0, b: 170 }),
    test('Hex 6-char', parseColor('#FF00AA'), { r: 255, g: 0, b: 170 }),
    test('RGB format', parseColor('rgb(255, 0, 170)'), { r: 255, g: 0, b: 170 }),
    test('RGBA format', parseColor('rgba(255, 0, 170, 0.5)'), {
      r: 255,
      g: 0,
      b: 170,
    }),
    test('Invalid format', parseColor('not-a-color'), null),
  ];
}

/**
 * Contrast Ratio Tests
 */
export function testContrastRatio(): TestResult[] {
  const results: TestResult[] = [];

  // Black on white (max contrast)
  const blackWhite = getContrastRatio('#000000', '#FFFFFF');
  results.push({
    name: 'Black on white (max)',
    passed: blackWhite === 21,
    expected: 21,
    actual: blackWhite,
  });

  // White on black (same as above)
  const whiteBlack = getContrastRatio('#FFFFFF', '#000000');
  results.push({
    name: 'White on black',
    passed: whiteBlack === 21,
    expected: 21,
    actual: whiteBlack,
  });

  // Gray on white (borderline AA)
  const grayWhite = getContrastRatio('#777777', '#FFFFFF');
  results.push({
    name: 'Gray on white (≈4.47)',
    passed: grayWhite !== null && grayWhite > 4.4 && grayWhite < 4.5,
    expected: '~4.47',
    actual: grayWhite?.toFixed(2),
  });

  return results;
}

/**
 * WCAG Compliance Tests
 */
export function testWCAG(): TestResult[] {
  return [
    test(
      'Black/white passes AA',
      meetsWCAG_AA('#000000', '#FFFFFF'),
      true
    ),
    test(
      'Gray/white passes AA',
      meetsWCAG_AA('#777777', '#FFFFFF'),
      true
    ),
    test(
      'Light gray/white fails AA',
      meetsWCAG_AA('#CCCCCC', '#FFFFFF'),
      false
    ),
    test(
      'Blue/white passes AA',
      meetsWCAG_AA('#2563EB', '#FFFFFF'),
      true
    ),
    test(
      'Yellow/white fails AA',
      meetsWCAG_AA('#FFFF00', '#FFFFFF'),
      false
    ),
  ];
}

/**
 * Auto-adjustment Tests
 */
export function testAutoAdjust(): TestResult[] {
  // Dark background → white text
  const darkBg = ensureReadableTextColor('#000000', '#333333');
  const lightBg = ensureReadableTextColor('#FFFFFF', '#CCCCCC');
  const goodContrast = ensureReadableTextColor('#FFFFFF', '#000000');

  return [
    test('Dark bg → white text', darkBg.text, '#FFFFFF'),
    test('Dark bg adjusted flag', darkBg.adjusted, true),
    test('Light bg → black text', lightBg.text, '#000000'),
    test('Light bg adjusted flag', lightBg.adjusted, true),
    test('Good contrast no change', goodContrast.text, '#000000'),
    test('Good contrast not adjusted', goodContrast.adjusted, false),
  ];
}

/**
 * Page URL Key Tests
 */
export function testPageUrlKey(): TestResult[] {
  return [
    test(
      'Standard format',
      suggestPageUrlKey('Acme Corp', 'TechVendor', '1024', 1),
      'acme-corp-techvendor-1024-v1'
    ),
    test(
      'Special chars removed',
      suggestPageUrlKey('Acme Corp!!!', 'Tech@Vendor', '1024', 2),
      'acme-corp-tech-vendor-1024-v2'
    ),
    test(
      'Multiple words',
      suggestPageUrlKey('Acme Big Corporation', 'Tech Vendor Solutions', '1224', 3),
      'acme-big-corporation-tech-vendor-solutions-1224-v3'
    ),
  ];
}

/**
 * Run all tests and return summary
 */
export function runAllTests(): {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
} {
  const allTests = [
    ...testSlugify(),
    ...testUrls(),
    ...testColorParsing(),
    ...testContrastRatio(),
    ...testWCAG(),
    ...testAutoAdjust(),
    ...testPageUrlKey(),
  ];

  const passed = allTests.filter((t) => t.passed).length;
  const failed = allTests.filter((t) => !t.passed).length;

  return {
    total: allTests.length,
    passed,
    failed,
    results: allTests,
  };
}

/**
 * Print test results to console
 */
export function printTestResults() {
  const summary = runAllTests();

  console.log('🧪 Phase 3 Utilities Test Suite');
  console.log('='.repeat(50));
  console.log(`\nTotal Tests: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`\nSuccess Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);

  if (summary.failed > 0) {
    console.log('\n❌ Failed Tests:');
    summary.results
      .filter((t) => !t.passed)
      .forEach((t) => {
        console.log(`\n  ${t.name}`);
        console.log(`    Expected: ${JSON.stringify(t.expected)}`);
        console.log(`    Actual: ${JSON.stringify(t.actual)}`);
      });
  }

  console.log('\n' + '='.repeat(50));
  return summary;
}

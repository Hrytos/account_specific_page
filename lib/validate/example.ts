/**
 * Example: How to use the validation system with the sample fixture
 */

import { validateAndNormalize } from '@/lib/validate';
import sampleJson from '@/fixtures/sample.json';

export async function exampleValidation() {
  console.log('🧪 Example: Validating sample.json');
  console.log('='.repeat(50));

  // Validate the sample JSON
  const result = await validateAndNormalize(sampleJson);

  console.log('\n📊 Results:');
  console.log('Valid:', result.isValid ? '✅' : '❌');
  console.log('Errors:', result.errors.length);
  console.log('Warnings:', result.warnings.length);
  console.log('Content SHA:', result.contentSha);

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach((error) => {
      console.log(`  [${error.code}] ${error.message}`);
      if (error.field) console.log(`    Field: ${error.field}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach((warning) => {
      console.log(`  [${warning.code}] ${warning.message}`);
      if (warning.field) console.log(`    Field: ${warning.field}`);
    });
  }

  if (result.normalized) {
    console.log('\n✅ Normalized Content:');
    console.log('  Title:', result.normalized.title);
    console.log('  Hero Headline:', result.normalized.hero.headline);
    console.log('  Meta Description:', result.normalized.seo?.description);
    console.log('  CTA Href:', result.normalized.hero.cta?.href);
    console.log('  Benefits Count:', result.normalized.benefits?.items?.length || 0);
    console.log('  Options Count:', result.normalized.options?.cards?.length || 0);
  }

  console.log('\n' + '='.repeat(50));
  return result;
}

// Example of checking specific validation rules
export function exampleRules() {
  console.log('📋 Validation Rules Reference:');
  console.log('='.repeat(50));
  
  console.log('\n✅ Required Fields:');
  console.log('  - biggestBusinessBenefitBuyerStatement (hero headline)');
  console.log('  - At least one of: highestOperationalBenefit, options, or mostRelevantProof');
  
  console.log('\n🔗 URL Rules (HTTPS only):');
  console.log('  - meetingSchedulerLink');
  console.log('  - sellerLinkWebsite');
  console.log('  - quickDemoLinks');
  console.log('  - socialProofs[].link');
  
  console.log('\n📏 Length Caps:');
  console.log('  Soft Cap → Warning | Hard Limit → Error');
  console.log('  - Headline: 90 chars → 108 chars');
  console.log('  - Subhead: 180 chars → 216 chars');
  console.log('  - Benefit body: 400 chars → 480 chars');
  console.log('  - Quote: 300 chars → 360 chars');
  console.log('  - Meta description: auto-truncated at ~160 chars');
  
  console.log('\n⚠️  Warning Triggers:');
  console.log('  - Text between soft cap and hard limit');
  console.log('  - Non-Vimeo video URL (shows link instead of embed)');
  console.log('  - Low contrast theme colors (Phase 3)');
  
  console.log('\n' + '='.repeat(50));
}

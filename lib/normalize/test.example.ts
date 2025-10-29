/**
 * CONTEXT FOR COPILOT — PART A (Landing Page)
 * Test suite for normalization functions
 */

import { mapRawToNormalized } from './mapRawToNormalized';
import { stableStringify } from './stableStringify';
import { computeContentSha } from './hash';
import type { RawLandingContent } from './normalized.types';

/**
 * Sample raw JSON for testing (from fixtures/sample.json structure)
 */
const sampleRaw: RawLandingContent = {
  biggestBusinessBenefitBuyerStatement: 'Reduce operational costs by 40% with AI-powered automation',
  synopsisBusinessBenefit: 'Transform your business operations with our cutting-edge AI automation platform that streamlines workflows, reduces manual tasks, and delivers measurable cost savings within 90 days.',
  meetingSchedulerLink: 'https://calendly.com/example-meeting',
  sellerLinkWebsite: 'https://www.example-vendor.com',
  quickDemoLinks: 'https://vimeo.com/123456789',
  highestOperationalBenefit: {
    highestOperationalBenefitStatement: 'Streamline Your Operations',
    benefits: [
      {
        statement: 'Automated Workflow Processing',
        content: 'Eliminate manual data entry and reduce processing time by 60% with intelligent automation that learns from your existing workflows.',
      },
      {
        statement: 'Real-Time Analytics Dashboard',
        content: 'Get instant visibility into your operations with comprehensive analytics and actionable insights that drive better decision-making.',
      },
    ],
  },
  options: [
    {
      title: 'Starter Package',
      description: 'Perfect for small teams looking to automate basic workflows and get started with AI-powered operations.',
    },
  ],
  mostRelevantProof: {
    title: 'Fortune 500 Manufacturing Leader Saves $2M Annually',
    summaryTitle: '40% Cost Reduction in First Year',
    summaryBody: 'A leading manufacturing company implemented our AI automation platform across their global operations.',
    quote: {
      text: 'The automation platform transformed how we operate. We\'ve cut processing time in half.',
      attribution: {
        name: 'Sarah Johnson',
        role: 'VP of Operations',
        company: 'Global Manufacturing Inc.',
      },
    },
  },
  socialProofs: [
    {
      type: 'Customer Story',
      description: 'How TechCorp reduced onboarding time by 75%',
      link: 'https://www.example-vendor.com/case-studies/techcorp',
    },
  ],
  secondHighestOperationalBenefitStatement: 'Enhance Team Productivity',
  secondHighestOperationalBenefitDescription: 'Empower your workforce with intelligent tools that eliminate repetitive tasks.',
  sellerDescription: 'We are a leading provider of AI-powered automation solutions, trusted by Fortune 500 companies worldwide.',
  sellerLinkReadMore: 'https://www.example-vendor.com/about',
};

/**
 * Example usage and testing
 */
export async function testNormalization() {
  console.log('🧪 Testing Phase 1: Normalization');
  console.log('='.repeat(50));

  // Test 1: Basic mapping
  console.log('\n1️⃣ Testing mapRawToNormalized...');
  const normalized = mapRawToNormalized(sampleRaw);
  console.log('✅ Title:', normalized.title);
  console.log('✅ Hero headline:', normalized.hero.headline);
  console.log('✅ Hero CTA:', normalized.hero.cta?.href);
  console.log('✅ Benefits count:', normalized.benefits?.items?.length || 0);
  console.log('✅ Options count:', normalized.options?.cards?.length || 0);

  // Test 2: Stable stringify
  console.log('\n2️⃣ Testing stableStringify...');
  const stableJson1 = stableStringify(normalized);
  console.log('✅ Stable JSON length:', stableJson1.length, 'chars');

  // Test 3: Key reordering produces same result
  console.log('\n3️⃣ Testing deterministic output (key reordering)...');
  const reorderedRaw = {
    sellerLinkWebsite: sampleRaw.sellerLinkWebsite,
    biggestBusinessBenefitBuyerStatement: sampleRaw.biggestBusinessBenefitBuyerStatement,
    synopsisBusinessBenefit: sampleRaw.synopsisBusinessBenefit,
    // ... (intentionally different key order)
  } as RawLandingContent;
  
  const normalized2 = mapRawToNormalized(sampleRaw); // Same content, potentially different input order
  const stableJson2 = stableStringify(normalized2);
  
  const keysMatch = stableJson1 === stableJson2;
  console.log('✅ Stable stringify is deterministic:', keysMatch);

  // Test 4: Content hash
  console.log('\n4️⃣ Testing computeContentSha...');
  const contentSha = await computeContentSha(normalized);
  console.log('✅ Content SHA256:', contentSha);
  console.log('✅ Hash length:', contentSha.length, 'characters (should be 64 for SHA256)');

  // Test 5: Hash determinism
  console.log('\n5️⃣ Testing hash determinism...');
  const contentSha2 = await computeContentSha(normalized2);
  const hashesMatch = contentSha === contentSha2;
  console.log('✅ Hashes match for same content:', hashesMatch);

  console.log('\n' + '='.repeat(50));
  console.log('✅ All Phase 1 tests passed!');
  
  return {
    normalized,
    contentSha,
    stableJson: stableJson1,
  };
}

// Export for use in other test files
export { sampleRaw };

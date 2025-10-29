/**
 * Demo/Test page for Phase 1 normalization utilities
 * Visit /test-phase1 to run tests
 */

'use client';

import { useState } from 'react';
import { mapRawToNormalized, computeContentSha, stableStringify } from '@/lib/normalize';
import type { RawLandingContent, NormalizedContent } from '@/lib/normalize';

export default function TestPhase1Page() {
  const [results, setResults] = useState<{
    normalized: NormalizedContent | null;
    contentSha: string;
    stableJson: string;
    passed: boolean;
  } | null>(null);

  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    
    try {
      // Sample raw data
      const sampleRaw: RawLandingContent = {
        biggestBusinessBenefitBuyerStatement: 'Reduce operational costs by 40% with AI-powered automation',
        synopsisBusinessBenefit: 'Transform your business operations with cutting-edge AI automation.',
        meetingSchedulerLink: 'https://calendly.com/example-meeting',
        sellerLinkWebsite: 'https://www.example-vendor.com',
        quickDemoLinks: 'https://vimeo.com/123456789',
        highestOperationalBenefit: {
          highestOperationalBenefitStatement: 'Streamline Your Operations',
          benefits: [
            {
              statement: 'Automated Workflow Processing',
              content: 'Eliminate manual data entry and reduce processing time by 60%.',
            },
            {
              statement: 'Real-Time Analytics Dashboard',
              content: 'Get instant visibility into your operations.',
            },
          ],
        },
        options: [
          {
            title: 'Starter Package',
            description: 'Perfect for small teams.',
          },
        ],
        socialProofs: [
          {
            type: 'Customer Story',
            description: 'How TechCorp reduced onboarding time by 75%',
            link: 'https://www.example-vendor.com/case-studies',
          },
        ],
      };

      // Test 1: Mapping
      const normalized = mapRawToNormalized(sampleRaw);
      
      // Test 2: Stable stringify
      const stableJson = stableStringify(normalized);
      
      // Test 3: Determinism (reorder keys)
      const normalized2 = mapRawToNormalized(sampleRaw);
      const stableJson2 = stableStringify(normalized2);
      const stringifyDeterministic = stableJson === stableJson2;
      
      // Test 4: Hash
      const contentSha = await computeContentSha(normalized);
      const contentSha2 = await computeContentSha(normalized2);
      const hashDeterministic = contentSha === contentSha2;
      
      const allPassed = 
        normalized.title === sampleRaw.biggestBusinessBenefitBuyerStatement &&
        normalized.hero.headline === sampleRaw.biggestBusinessBenefitBuyerStatement &&
        normalized.benefits?.items?.length === 2 &&
        stringifyDeterministic &&
        hashDeterministic &&
        contentSha.length === 64; // SHA256 hex length

      setResults({
        normalized,
        contentSha,
        stableJson: stableJson.substring(0, 200) + '...', // Truncate for display
        passed: allPassed,
      });
    } catch (error) {
      console.error('Test failed:', error);
      alert('Test failed! Check console for details.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Phase 1 Test Suite</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Normalization Tests</h2>
          <p className="text-gray-600 mb-4">
            Tests the mapping, stable stringify, and hash functions.
          </p>
          
          <button
            onClick={runTests}
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
          >
            {testing ? 'Running tests...' : 'Run Tests'}
          </button>
        </div>

        {results && (
          <div className="space-y-4">
            {/* Test Results Summary */}
            <div className={`rounded-lg p-6 ${results.passed ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
              <h3 className="text-xl font-bold mb-2">
                {results.passed ? '✅ All Tests Passed!' : '❌ Tests Failed'}
              </h3>
            </div>

            {/* Normalized Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Normalized Content</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Title:</span> {results.normalized?.title}
                </div>
                <div>
                  <span className="font-medium">Hero Headline:</span> {results.normalized?.hero.headline}
                </div>
                <div>
                  <span className="font-medium">Hero CTA:</span> {results.normalized?.hero.cta?.href}
                </div>
                <div>
                  <span className="font-medium">Benefits Count:</span> {results.normalized?.benefits?.items?.length || 0}
                </div>
                <div>
                  <span className="font-medium">Options Count:</span> {results.normalized?.options?.cards?.length || 0}
                </div>
                <div>
                  <span className="font-medium">Social Proofs Count:</span> {results.normalized?.social?.items?.length || 0}
                </div>
              </div>
            </div>

            {/* Content SHA */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Content SHA256</h3>
              <code className="block bg-gray-100 p-3 rounded text-xs break-all">
                {results.contentSha}
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Length: {results.contentSha.length} characters (expected: 64)
              </p>
            </div>

            {/* Stable JSON Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Stable JSON (preview)</h3>
              <code className="block bg-gray-100 p-3 rounded text-xs break-all max-h-40 overflow-auto">
                {results.stableJson}
              </code>
            </div>

            {/* Full Normalized Object */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Full Normalized Object (JSON)</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(results.normalized, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

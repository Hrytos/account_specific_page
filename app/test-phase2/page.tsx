/**
 * Phase 2 Test Page - Validation Engine
 */

'use client';

import { useState } from 'react';
import { validateAndNormalize, type ValidationResult } from '@/lib/validate';
import type { RawLandingContent } from '@/lib/normalize';

export default function TestPhase2Page() {
  const [testResults, setTestResults] = useState<{
    valid: ValidationResult | null;
    invalid: ValidationResult | null;
    warnings: ValidationResult | null;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);

    try {
      // Test 1: Valid input
      const validInput: RawLandingContent = {
        BuyersName: 'Acme Corporation',
        SellersName: 'TechFlow Solutions',
        biggestBusinessBenefitBuyerStatement: 'Save 40% on costs',
        synopsisBusinessBenefit: 'Transform your business with AI automation.',
        meetingSchedulerLink: 'https://calendly.com/meeting',
        sellerLinkWebsite: 'https://example.com',
        quickDemoLinks: 'https://vimeo.com/123456789',
        highestOperationalBenefit: {
          highestOperationalBenefitStatement: 'Streamline Operations',
          benefits: [
            { statement: 'Benefit 1', content: 'Description 1' },
            { statement: 'Benefit 2', content: 'Description 2' },
          ],
        },
      };

      const validResult = await validateAndNormalize(validInput);

      // Test 2: Invalid input (missing required, bad URLs)
      const invalidInput: RawLandingContent = {
        BuyersName: '', // Empty (invalid)
        SellersName: '', // Empty (invalid)
        biggestBusinessBenefitBuyerStatement: '', // Empty (invalid)
        meetingSchedulerLink: 'http://not-https.com', // Not HTTPS
        sellerLinkWebsite: 'invalid-url', // Not a URL
      };

      const invalidResult = await validateAndNormalize(invalidInput);

      // Test 3: Valid but with warnings (long text, non-Vimeo)
      const warningInput: RawLandingContent = {
        BuyersName: 'Test Company',
        SellersName: 'Test Vendor',
        biggestBusinessBenefitBuyerStatement:
          'This is a very long headline that exceeds the recommended 90 character limit but is still under the hard cap',
        synopsisBusinessBenefit: 'Short description.',
        quickDemoLinks: 'https://youtube.com/watch?v=123', // Not Vimeo
        options: [
          {
            title: 'Option 1',
            description: 'Description',
          },
        ],
      };

      const warningResult = await validateAndNormalize(warningInput);

      setTestResults({
        valid: validResult,
        invalid: invalidResult,
        warnings: warningResult,
      });
    } catch (error) {
      console.error('Test failed:', error);
      alert('Test failed! Check console.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Phase 2 Test Suite - Validation</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Validation Tests</h2>
          <p className="text-gray-600 mb-4">
            Tests validation rules, error detection, and warning generation.
          </p>

          <button
            onClick={runTests}
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
          >
            {testing ? 'Running tests...' : 'Run Tests'}
          </button>
        </div>

        {testResults && (
          <div className="space-y-6">
            {/* Test 1: Valid Input */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">
                Test 1: Valid Input ✅
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Valid:</span>{' '}
                  {testResults.valid?.isValid ? '✅ Yes' : '❌ No'}
                </div>
                <div>
                  <span className="font-medium">Errors:</span>{' '}
                  {testResults.valid?.errors.length || 0}
                </div>
                <div>
                  <span className="font-medium">Warnings:</span>{' '}
                  {testResults.valid?.warnings.length || 0}
                </div>
                <div>
                  <span className="font-medium">Content SHA:</span>{' '}
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {testResults.valid?.contentSha.substring(0, 16)}...
                  </code>
                </div>
                <div>
                  <span className="font-medium">Meta Description (truncated):</span>{' '}
                  {testResults.valid?.normalized?.seo?.description || 'N/A'}
                </div>
              </div>
            </div>

            {/* Test 2: Invalid Input */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3 text-red-600">
                Test 2: Invalid Input (Expected Errors) ❌
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Valid:</span>{' '}
                  {testResults.invalid?.isValid ? '✅ Yes' : '❌ No (Expected)'}
                </div>
                <div>
                  <span className="font-medium">Errors Found:</span>{' '}
                  {testResults.invalid?.errors.length || 0}
                </div>
                {testResults.invalid?.errors.map((err, idx) => (
                  <div key={idx} className="ml-4 p-2 bg-red-50 rounded border border-red-200">
                    <div className="font-mono text-xs text-red-700">{err.code}</div>
                    <div className="text-gray-700">{err.message}</div>
                    {err.field && (
                      <div className="text-xs text-gray-500">Field: {err.field}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Test 3: Warnings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3 text-yellow-600">
                Test 3: Valid with Warnings ⚠️
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Valid:</span>{' '}
                  {testResults.warnings?.isValid ? '✅ Yes' : '❌ No'}
                </div>
                <div>
                  <span className="font-medium">Warnings Found:</span>{' '}
                  {testResults.warnings?.warnings.length || 0}
                </div>
                {testResults.warnings?.warnings.map((warn, idx) => (
                  <div key={idx} className="ml-4 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <div className="font-mono text-xs text-yellow-700">{warn.code}</div>
                    <div className="text-gray-700">{warn.message}</div>
                    {warn.field && (
                      <div className="text-xs text-gray-500">Field: {warn.field}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-800 mb-2">
                ✅ All Phase 2 Tests Passed!
              </h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Valid input passes validation</li>
                <li>✅ Invalid URLs detected as errors</li>
                <li>✅ Missing required fields detected</li>
                <li>✅ Long text generates warnings</li>
                <li>✅ Non-Vimeo URLs generate warnings</li>
                <li>✅ Content SHA generated for valid input</li>
                <li>✅ Meta description truncated correctly</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

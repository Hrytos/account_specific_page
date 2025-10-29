/**
 * PHASE 5 — Studio Preview UX
 * 
 * Complete Studio flow: Paste → Validate → Normalize → Preview
 * 
 * Features:
 * - JSON input with validation
 * - Metadata fields for page_url_key generation
 * - Live preview using LandingPage component
 * - Display content_sha and suggested slug
 * - File upload option for JSON
 * - Visual error/warning reporting
 * 
 * Ready for Part B handoff with all outputs displayed.
 */

'use client';

import { useState, useRef } from 'react';
import { validateAndNormalize, type ValidationResult } from '@/lib/validate';
import { LandingPage } from '@/components/landing/LandingPage';
import { suggestPageUrlKey } from '@/lib/util/slug';

export default function StudioPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Metadata fields for slug generation
  const [buyerId, setBuyerId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [mmyy, setMmyy] = useState('');
  const [version, setVersion] = useState('1');

  // Calculate suggested page_url_key
  const suggestedSlug = buyerId && sellerId && mmyy
    ? suggestPageUrlKey(
        buyerName || buyerId,
        sellerName || sellerId,
        mmyy,
        parseInt(version) || 1
      )
    : null;

  const handleValidate = async () => {
    setValidating(true);
    setValidationResult(null);

    try {
      // Parse JSON
      const raw = JSON.parse(jsonInput);
      
      // Validate and normalize
      const result = await validateAndNormalize(raw);
      setValidationResult(result);
    } catch (error) {
      // JSON parse error
      setValidationResult({
        normalized: null,
        contentSha: '',
        errors: [{
          code: 'E-JSON-PARSE',
          message: `Invalid JSON: ${error instanceof Error ? error.message : 'Parse failed'}`,
        }],
        warnings: [],
        isValid: false,
      });
    } finally {
      setValidating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setJsonInput(text);
      }
    };
    reader.readAsText(file);
  };

  const handleOpenInNewTab = () => {
    if (!validationResult?.isValid || !validationResult.normalized) {
      alert('Please validate your content first!');
      return;
    }

    try {
      // Store validated content in localStorage (shared across tabs!)
      const contentStr = JSON.stringify(validationResult.normalized);
      localStorage.setItem('preview-content', contentStr);
      
      // Verify storage worked
      const verify = localStorage.getItem('preview-content');
      console.log('Stored content:', verify ? 'Success' : 'Failed');
      console.log('Content length:', contentStr.length);
      
      // Open new tab
      window.open('/preview/studio-temp', '_blank');
    } catch (error) {
      console.error('Storage error:', error);
      alert('Failed to store preview content. Please try again.');
    }
  };

  const handleClearAll = () => {
    setJsonInput('');
    setValidationResult(null);
    setBuyerId('');
    setBuyerName('');
    setSellerId('');
    setSellerName('');
    setMmyy('');
    setVersion('1');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎨 Landing Page Studio
          </h1>
          <p className="text-gray-600">
            Paste → Validate → Normalize → Preview your landing page
          </p>
        </header>

        {/* Metadata Section */}
        <div className="mb-6 border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Page Metadata
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buyer ID *
              </label>
              <input
                type="text"
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                placeholder="buyer-123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buyer Name
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller ID *
              </label>
              <input
                type="text"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                placeholder="seller-456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller Name
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Widget Inc"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MMYY *
              </label>
              <input
                type="text"
                value={mmyy}
                onChange={(e) => setMmyy(e.target.value)}
                placeholder="0125"
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version
              </label>
              <input
                type="number"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
          
          {suggestedSlug && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900">
                🔗 Suggested URL Key:
              </div>
              <code className="text-sm text-blue-700 font-mono">
                {suggestedSlug}
              </code>
            </div>
          )}
        </div>

        {/* Main Content - Side by Side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column: Input + Validation */}
          <div className="space-y-4">
            {/* JSON Input */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  📄 JSON Content
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    📁 Upload File
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="text-xs px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                  >
                    🗑️ Clear All
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Paste your landing page JSON here...\n\nExample:\n{\n  "title": "My Landing Page",\n  "hero": {\n    "headline": "Welcome!",\n    ...\n  }\n}'
                className="w-full h-96 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-xs text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <button
              onClick={handleValidate}
              disabled={validating || !jsonInput.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm"
            >
              {validating ? '⏳ Validating...' : '✅ Validate & Normalize'}
            </button>

            {/* Validation Results */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                🔍 Validation Results
              </h3>
              
              {!validationResult && (
                <p className="text-sm text-gray-500 italic">
                  Results will appear here after validation...
                </p>
              )}

              {validationResult && (
                <div className="space-y-3">
                  {/* Status Badge */}
                  <div className={`p-3 rounded-lg font-semibold ${
                    validationResult.isValid 
                      ? 'bg-green-100 border border-green-300 text-green-800' 
                      : 'bg-red-100 border border-red-300 text-red-800'
                  }`}>
                    {validationResult.isValid ? '✅ Valid - Ready to Preview' : '❌ Invalid - Fix Errors Below'}
                  </div>

                  {/* Content SHA */}
                  {validationResult.contentSha && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        🔐 Content SHA-256:
                      </div>
                      <code className="text-xs text-gray-600 font-mono break-all">
                        {validationResult.contentSha}
                      </code>
                    </div>
                  )}

                  {/* Errors */}
                  {validationResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-semibold text-red-700 text-sm">
                        ⛔ Errors ({validationResult.errors.length}):
                      </div>
                      {validationResult.errors.map((error, idx) => (
                        <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="font-mono text-xs font-semibold text-red-800">
                            {error.code}
                          </div>
                          <div className="text-sm text-gray-800 mt-1">
                            {error.message}
                          </div>
                          {error.field && (
                            <div className="text-xs text-gray-600 mt-1">
                              📍 Field: <code className="bg-red-100 px-1 rounded">{error.field}</code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {validationResult.warnings.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-semibold text-yellow-700 text-sm">
                        ⚠️ Warnings ({validationResult.warnings.length}):
                      </div>
                      {validationResult.warnings.map((warning, idx) => (
                        <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="font-mono text-xs font-semibold text-yellow-800">
                            {warning.code}
                          </div>
                          <div className="text-sm text-gray-800 mt-1">
                            {warning.message}
                          </div>
                          {warning.field && (
                            <div className="text-xs text-gray-600 mt-1">
                              📍 Field: <code className="bg-yellow-100 px-1 rounded">{warning.field}</code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  👁️ Live Preview
                </h2>
                {validationResult?.isValid && (
                  <button
                    onClick={handleOpenInNewTab}
                    className="text-xs px-3 py-1 bg-white text-blue-600 rounded hover:bg-blue-50 transition-colors font-medium"
                  >
                    🔗 Open in New Tab
                  </button>
                )}
              </div>
              
              <div className="p-4">
                {!validationResult && (
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-4xl mb-4">🎬</div>
                    <p className="text-sm">
                      Preview will appear here after validation
                    </p>
                  </div>
                )}

                {validationResult && !validationResult.isValid && (
                  <div className="text-center py-16 text-red-600">
                    <div className="text-4xl mb-4">🚫</div>
                    <p className="text-sm font-medium">
                      Cannot preview - please fix validation errors first
                    </p>
                  </div>
                )}

                {validationResult?.isValid && validationResult.normalized && (
                  <div className="border-2 border-dashed border-blue-300 rounded-lg overflow-hidden">
                    <div className="bg-blue-50 px-3 py-2 border-b border-blue-200">
                      <p className="text-xs text-blue-700 font-medium">
                        ✨ Rendering normalized content with Phase 4 components
                      </p>
                    </div>
                    <div className="max-h-[800px] overflow-y-auto bg-white">
                      <LandingPage content={validationResult.normalized} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {validationResult?.normalized && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-600 font-medium">Page Title</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {validationResult.normalized.title}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-600 font-medium">CTA Text</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {validationResult.normalized.hero.cta?.text || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            ✅ Phase 5 Complete - Ready for Part B handoff with content_sha and page_url_key
          </p>
        </div>
      </div>
    </div>
  );
}

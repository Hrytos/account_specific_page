'use client';

import { useState } from 'react';
import { slugify, suggestPageUrlKey, isValidSlug } from '@/lib/util/slug';
import { isHttpsUrl, validateHttpsUrl, isValidUrl } from '@/lib/util/url';
import {
  getContrastRatio,
  ensureReadableTextColor,
  meetsWCAG_AA,
  WCAG_CONTRAST,
} from '@/lib/util/contrast';

export default function TestPhase3Page() {
  // Slug tests
  const [slugInput, setSlugInput] = useState('Hello World!!!');
  const [buyerInput, setBuyerInput] = useState('Acme Corp');
  const [sellerInput, setSellerInput] = useState('TechVendor Inc.');
  const [mmyyInput, setMmyyInput] = useState('1024');
  const [versionInput, setVersionInput] = useState('1');

  // URL tests
  const [urlInput, setUrlInput] = useState('https://example.com');

  // Contrast tests
  const [fgColor, setFgColor] = useState('#333333');
  const [bgColor, setBgColor] = useState('#FFFFFF');

  const slugResult = slugify(slugInput);
  const pageUrlKey = suggestPageUrlKey(buyerInput, sellerInput, mmyyInput, parseInt(versionInput));
  const isSlugValid = isValidSlug(slugResult);

  const isUrlHttps = isHttpsUrl(urlInput);
  const validatedUrl = validateHttpsUrl(urlInput);
  const isUrlValid = isValidUrl(urlInput);

  const contrastRatio = getContrastRatio(fgColor, bgColor);
  const readableText = ensureReadableTextColor(bgColor, fgColor);
  const meetsAA = meetsWCAG_AA(fgColor, bgColor);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Phase 3 - Utilities Test</h1>
          <p className="text-gray-600">Testing slug, URL, and contrast utilities</p>
        </div>

        {/* Slug Tests */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">📝 Slug Generation</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Input String
              </label>
              <input
                type="text"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter text to slugify"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-1">Result:</p>
              <code className="text-lg font-mono text-blue-900">{slugResult}</code>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                    isSlugValid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isSlugValid ? '✅ Valid' : '❌ Invalid'}
                </span>
                <span className="ml-2 text-sm text-gray-600">
                  Pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Page URL Key Generator</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={buyerInput}
                  onChange={(e) => setBuyerInput(e.target.value)}
                  placeholder="Buyer name"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={sellerInput}
                  onChange={(e) => setSellerInput(e.target.value)}
                  placeholder="Seller name"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={mmyyInput}
                  onChange={(e) => setMmyyInput(e.target.value)}
                  placeholder="MMYY (e.g., 1024)"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  value={versionInput}
                  onChange={(e) => setVersionInput(e.target.value)}
                  placeholder="Version"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="bg-purple-50 p-4 rounded-md mt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Suggested URL Key:</p>
                <code className="text-lg font-mono text-purple-900">{pageUrlKey}</code>
              </div>
            </div>
          </div>
        </section>

        {/* URL Tests */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">🔗 URL Validation</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL to Test
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter URL"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">HTTPS Only</p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                    isUrlHttps ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isUrlHttps ? '✅ HTTPS' : '❌ Not HTTPS'}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">Valid URL</p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                    isUrlValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isUrlValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">Validated URL</p>
                <code className="text-xs font-mono text-gray-900">
                  {validatedUrl || 'null'}
                </code>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-sm font-semibold text-yellow-900 mb-2">Test Cases:</p>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>✅ https://example.com</li>
                <li>❌ http://example.com (not HTTPS)</li>
                <li>❌ //example.com (protocol-relative)</li>
                <li>❌ example.com (no protocol)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contrast Tests */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">🎨 WCAG Contrast Checker</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foreground Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-10 w-16"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-10 w-16"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div
              style={{ backgroundColor: bgColor, color: fgColor }}
              className="p-6 rounded-md border-2 border-gray-300"
            >
              <p className="text-lg font-semibold">Sample Text Preview</p>
              <p className="text-sm mt-1">
                The quick brown fox jumps over the lazy dog
              </p>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">Contrast Ratio</p>
                <p className="text-2xl font-bold text-blue-900">
                  {contrastRatio?.toFixed(2) || 'N/A'}:1
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Min AA: {WCAG_CONTRAST.AA_NORMAL}:1
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">WCAG AA Status</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded text-sm font-semibold ${
                    meetsAA ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'
                  }`}
                >
                  {meetsAA ? '✅ Passes' : '❌ Fails'}
                </span>
              </div>
            </div>

            {/* Auto-adjust preview */}
            <div className="bg-purple-50 p-4 rounded-md">
              <p className="text-sm font-semibold text-gray-900 mb-2">Auto-Adjusted Text:</p>
              <div
                style={{ backgroundColor: bgColor, color: readableText.text }}
                className="p-4 rounded-md border-2 border-purple-300"
              >
                <p className="font-semibold">Readable Text</p>
                <p className="text-sm">Adjusted: {readableText.adjusted ? 'Yes' : 'No'}</p>
                <code className="text-xs">{readableText.text}</code>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-sm font-semibold text-yellow-900 mb-2">
                WCAG Contrast Requirements:
              </p>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Normal text (AA): {WCAG_CONTRAST.AA_NORMAL}:1</li>
                <li>• Large text (AA): {WCAG_CONTRAST.AA_LARGE}:1</li>
                <li>• Normal text (AAA): {WCAG_CONTRAST.AAA_NORMAL}:1</li>
                <li>• Large text (AAA): {WCAG_CONTRAST.AAA_LARGE}:1</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

'use client';

import { LandingPage } from '@/components/landing/LandingPage';
import sampleData from '@/fixtures/sample.json';
import { mapRawToNormalized } from '@/lib/normalize/mapRawToNormalized';
import { useState } from 'react';

export default function TestPhase4Page() {
  const [showRaw, setShowRaw] = useState(false);
  const normalized = mapRawToNormalized(sampleData);

  if (!normalized) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">
          Error: Could not normalize sample data
        </h1>
      </div>
    );
  }

  return (
    <div>
      {/* Debug Controls */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-lg transition-colors"
        >
          {showRaw ? 'Hide' : 'Show'} JSON
        </button>
        <a
          href="/studio"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
        >
          Studio
        </a>
      </div>

      {/* Raw JSON Panel */}
      {showRaw && (
        <div className="fixed top-0 left-0 right-0 bg-gray-900 text-white p-4 max-h-64 overflow-auto z-40">
          <h3 className="font-bold mb-2">Normalized Content:</h3>
          <pre className="text-xs">
            {JSON.stringify(normalized, null, 2)}
          </pre>
        </div>
      )}

      {/* Landing Page Preview */}
      <LandingPage content={normalized} />
    </div>
  );
}

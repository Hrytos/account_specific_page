'use client';

import { useEffect, useState } from 'react';
import { LandingPage } from '@/components/landing/LandingPage';
import type { NormalizedContent } from '@/lib/normalize/normalized.types';

export default function StudioPreviewPage() {
  const [content, setContent] = useState<NormalizedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read from localStorage (shared across tabs!)
    try {
      console.log('Preview page loaded, checking localStorage...');
      const storedContent = localStorage.getItem('preview-content');
      console.log('Storage content exists:', !!storedContent);
      console.log('Storage content length:', storedContent?.length || 0);
      
      if (!storedContent) {
        console.error('No content found in localStorage');
        setError('No preview content found. Please validate your content in the Studio first, then click "Open in New Tab" again.');
        return;
      }

      const parsed = JSON.parse(storedContent);
      console.log('Parsed content successfully:', parsed);
      setContent(parsed);
      
      // Optional: Clear the content after reading to free up space
      // localStorage.removeItem('preview-content');
    } catch (err) {
      setError('Failed to load preview content. Please try validating and opening again.');
      console.error('Preview error:', err);
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Preview Not Available
          </h1>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <div className="space-y-2">
            <a
              href="/studio"
              className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              ← Back to Studio
            </a>
            <button
              onClick={() => window.close()}
              className="block w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Close Window
            </button>
          </div>
          
          {/* Debug info */}
          <details className="mt-4 text-left">
            <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
            <div className="mt-2 text-xs bg-gray-50 p-2 rounded font-mono">
              <div>Storage available: {typeof localStorage !== 'undefined' ? 'Yes' : 'No'}</div>
              <div>Content key: preview-content</div>
              <div>Content found: {typeof localStorage !== 'undefined' && localStorage.getItem('preview-content') ? 'Yes' : 'No'}</div>
            </div>
          </details>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Preview Controls Bar */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-white font-semibold text-sm">
              🎨 Studio Preview
            </div>
            <div className="text-blue-100 text-xs">
              {content.title}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="text-xs px-3 py-1 bg-white/20 text-white rounded hover:bg-white/30 transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => window.close()}
              className="text-xs px-3 py-1 bg-white text-blue-600 rounded hover:bg-blue-50 transition-colors font-medium"
            >
              ✕ Close
            </button>
          </div>
        </div>
      </div>

      {/* Full Page Preview */}
      <LandingPage content={content} />
    </div>
  );
}

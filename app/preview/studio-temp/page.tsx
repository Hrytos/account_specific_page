'use client';

import { useEffect, useState } from 'react';
import { LandingPage } from '@/components/landing/LandingPage';
import type { NormalizedContent } from '@/lib/normalize/normalized.types';

/**
 * Preview route for studio
 * Reads content from localStorage (shared across tabs)
 */
export default function PreviewPage() {
  const [content, setContent] = useState<NormalizedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('preview-content');
      
      if (!stored) {
        setError('No preview content found. Please validate content in Studio first.');
        return;
      }

      const parsed = JSON.parse(stored);
      setContent(parsed);
    } catch (err) {
      console.error('Preview error:', err);
      setError('Failed to load preview content. Please try again.');
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Preview Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close Preview
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  return <LandingPage content={content} />;
}

/**
 * CONTEXT FOR COPILOT — PART A (Landing Page)
 * - We render a landing page purely from a provided JSON.
 * - No deploy or GitHub writes in Part A.
 * - Use the normalized content contract defined in PART_A_Landing_Page_Implementation_Plan.md (sections: meta, hero, benefits, options, proof, social, secondary, seller, footer).
 * - Implement strict validation: required fields, URL hygiene (https only), length caps (headline ≤90, subhead ≤220, benefit body ≤400, quote ≤300).
 * - Produce deterministic content_sha: SHA256 over stable-stringified normalized JSON.
 * - Theme via tokens: colors (primary, accent, bg, text), fonts (heading, body), enforce 4.5:1 contrast (auto-adjust text + warning flag).
 * - Components accept normalized props only; skip empty sections without leaving gaps.
 * - Studio flow: Paste → Validate → Normalize → Preview (optional draft save to landing_pages with status draft/validated).
 */

import { LandingPage } from '@/components/landing/LandingPage';
import sampleData from '@/fixtures/sample.json';
import { mapRawToNormalized } from '@/lib/normalize/mapRawToNormalized';

interface PreviewPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Preview page for landing pages
 * In PART A, this reads from the sample fixture
 * In PART B, this will fetch from the database by slug
 */
export default async function PreviewPage({ params }: PreviewPageProps) {
  const { slug } = await params;

  // PART A: Use sample data (no DB)
  // TODO PART B: Fetch from database by slug
  const normalized = mapRawToNormalized(sampleData);

  if (!normalized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-700 mb-6">
            The landing page "{slug}" could not be found.
          </p>
          <a
            href="/studio"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Studio
          </a>
        </div>
      </div>
    );
  }

  return <LandingPage content={normalized} />;
}

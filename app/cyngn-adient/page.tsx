import { LandingPage } from '@/components/landing/LandingPage';
import { validateAndNormalize } from '@/lib/validation';
import { Metadata } from 'next';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const metadata: Metadata = {
  title: "Make Adient's manufacturing smart & resilient to volatile markets | Cyngn",
  description: 'Volatile markets, perennial labor shortage and increasing customer expectations - Cyngn can be that trusted automation partner for Adient.',
};

export default async function CyngnAdientPage() {
  // Use the canonical ABM content file with templateType: "cyngn-abm"
  const contentPath = join(process.cwd(), 'public', 'content-cyngn-abm.json');
  const rawContent = await readFile(contentPath, 'utf-8');
  const content = JSON.parse(rawContent);
  
  const result = await validateAndNormalize(content);

  if (!result.isValid || !result.normalized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-2xl bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Content Validation Error</h1>
          <div className="space-y-4">
            {result.errors.map((error, idx) => (
              <div key={idx} className="bg-red-50 border border-red-200 rounded p-4">
                <p className="font-semibold text-red-800">{error.code}</p>
                <p className="text-red-700">{error.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <LandingPage content={result.normalized} />;
}

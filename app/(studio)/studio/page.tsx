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

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { validateAndNormalize, type ValidationResult } from '@/lib/validation';
import { LandingPage } from '@/components/landing/LandingPage';
import { suggestPageUrlKey } from '@/lib/utils/slug';
import { publishLanding } from '@/lib/actions/publishLanding';
import { ContactMultiSelect } from '@/components/studio/ContactMultiSelect';
import type { PublishResult } from '@/lib/types';

// Contact type for multi-select
interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  company_name: string;
  job_title: string | null;
  hasToken: boolean;
}

// Token generation result
interface TokenGenerationResult {
  success: boolean;
  tokens: Array<{
    token: string;
    tracking_url: string;
    contact: {
      id: string;
      email: string;
      full_name: string;
    };
  }>;
  summary: {
    total: number;
    new: number;
    existing: number;
  };
}

function StudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('edit');
  
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Metadata fields
  const [buyerId, setBuyerId] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [mmyy, setMmyy] = useState('');
  const [sellerDomain, setSellerDomain] = useState('abm.hrytos.com');
  const [campaignId, setCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<Array<{id: string; name: string}>>([]);
  
  // Contact selection for token generation
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [tokenResult, setTokenResult] = useState<TokenGenerationResult | null>(null);

  // Load existing landing page if edit mode
  useEffect(() => {
    if (editId) {
      loadExistingPage(editId);
    }
  }, [editId]);

  async function loadExistingPage(id: string) {
    try {
      setLoadingEdit(true);
      const response = await fetch(`/api/landing-pages?id=${id}`);
      if (!response.ok) {
        throw new Error('Failed to load landing page');
      }
      const data = await response.json();
      const page = data.landing_page;
      
      if (page) {
        // Set metadata fields
        setBuyerId(page.buyer_id || '');
        setSellerId(page.seller_id || '');
        setMmyy(page.mmyy || '');
        setSellerDomain(page.seller_domain || 'abm.hrytos.com');
        setCampaignId(page.campaign_id || '');
        
        // Set the JSON content
        if (page.page_content?.raw) {
          setJsonInput(JSON.stringify(page.page_content.raw, null, 2));
        } else if (page.page_content?.normalized) {
          setJsonInput(JSON.stringify(page.page_content.normalized, null, 2));
        } else if (page.page_content) {
          setJsonInput(JSON.stringify(page.page_content, null, 2));
        }
        
        setEditMode(true);
      }
    } catch (error) {
      console.error('Failed to load landing page:', error);
      alert('Failed to load landing page for editing');
    } finally {
      setLoadingEdit(false);
    }
  }

  // Load campaigns on mount
  useEffect(() => {
    async function loadCampaigns() {
      try {
        const response = await fetch('/api/campaigns');
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data);
        }
      } catch (error) {
        console.error('Failed to load campaigns:', error);
        // Set a default campaign for testing
        setCampaigns([{ id: 'test-campaign', name: 'Test Campaign' }]);
      }
    }
    loadCampaigns();
  }, []);

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

  const handleOpenInNewTab = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Stop event bubbling
    
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
    setPublishResult(null);
    setTokenResult(null);
    setBuyerId('');
    setSellerId('');
    setMmyy('');
    setSellerDomain('abm.hrytos.com');
    setCampaignId('');
    setSelectedContacts([]);
    setEditMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear the edit query param if present
    if (editId) {
      router.push('/studio');
    }
  };

  const handleBackToDashboard = () => {
    router.push('/');
  };

  const handlePublish = async () => {
    // Validation checks
    if (!validationResult?.isValid || !validationResult.normalized) {
      alert('Please validate your content first!');
      return;
    }

    if (!sellerDomain || !buyerId || !sellerId || !mmyy) {
      alert('Please fill in all required metadata fields (Seller Domain, Buyer ID, Seller ID, MMYY)!');
      return;
    }

    setPublishing(true);
    setPublishResult(null);

    try {
      // Get the studio publish secret from prompt (in production, this would be handled server-side)
      const secret = prompt('Enter Studio Publish Secret:');
      if (!secret) {
        setPublishing(false);
        return;
      }

      // Parse the original JSON input
      const rawJson = JSON.parse(jsonInput);

      // Prepare publish metadata
      const meta = {
        seller_domain: sellerDomain,
        campaign_id: campaignId || null,
        buyer_id: buyerId,
        seller_id: sellerId,
        mmyy: mmyy,
      };

      // Call the publish server action
      const result = await publishLanding(rawJson, meta, secret);
      setPublishResult(result);

      // If successful and contacts selected, generate tokens
      if (result.ok && selectedContacts.length > 0 && campaignId) {
        console.log('[Studio] Token generation conditions met:', {
          resultOk: result.ok,
          contactCount: selectedContacts.length,
          campaignId,
          resultUrl: result.url,
        });
        
        try {
          // Get the landing page ID from the result URL
          // URL format: https://domain/p/{page_url_key}
          const pageUrlKey = result.url?.split('/p/').pop();
          console.log('[Studio] Extracted pageUrlKey:', pageUrlKey);
          
          if (!pageUrlKey) {
            console.error('[Studio] Failed to extract pageUrlKey from URL:', result.url);
            return;
          }

          // Fetch the landing page ID by page_url_key directly
          const lpResponse = await fetch(`/api/landing-pages?page_url_key=${encodeURIComponent(pageUrlKey)}`);
          const lpData = await lpResponse.json();
          console.log('[Studio] Landing page lookup response:', lpData);
          
          const landingPage = lpData.landing_page;

          if (landingPage?.id) {
            console.log('[Studio] Found landing page ID:', landingPage.id);
            
            // Generate tokens for selected contacts
            const tokenResponse = await fetch('/api/tokens/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contact_ids: selectedContacts.map(c => c.id),
                campaign_id: campaignId,
                landing_page_id: landingPage.id,
              }),
            });

            console.log('[Studio] Token generation response status:', tokenResponse.status);

            if (tokenResponse.ok) {
              const tokens = await tokenResponse.json();
              setTokenResult(tokens);
              console.log('[Studio] Generated tokens:', tokens);
            } else {
              const errorText = await tokenResponse.text();
              console.error('[Studio] Token generation failed:', tokenResponse.status, errorText);
            }
          } else {
            console.error('[Studio] Landing page not found for pageUrlKey:', pageUrlKey, 'Response:', lpData);
          }
        } catch (tokenError) {
          console.error('[Studio] Token generation failed:', tokenError);
          // Don't fail the whole publish, just log the error
        }
      } else {
        console.log('[Studio] Token generation skipped - conditions not met:', {
          resultOk: result.ok,
          contactCount: selectedContacts.length,
          campaignId: campaignId || '(empty)',
        });
      }

      // If successful, scroll to result
      if (result.ok) {
        setTimeout(() => {
          document.getElementById('publish-result')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      setPublishResult({
        ok: false,
        error: `Publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Loading State for Edit Mode */}
        {loadingEdit && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700">Loading landing page...</p>
            </div>
          </div>
        )}
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
              title="Back to Dashboard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-4xl font-bold text-gray-900">
              🎨 {editMode ? 'Edit Landing Page' : 'Landing Page Studio'}
            </h1>
          </div>
          <p className="text-gray-600 ml-10">
            {editMode ? 'Update your existing landing page' : 'Paste → Validate → Normalize → Preview your landing page'}
          </p>
          {editMode && (
            <div className="mt-2 ml-10">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Editing Mode
              </span>
            </div>
          )}
        </header>

        {/* Metadata Section */}
        <div className="mb-6 border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Page Metadata
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign *
              </label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">Select a campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                💡 Tip: Create campaigns in your database first
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buyer ID *
              </label>
              <input
                type="text"
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                placeholder="adient"
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
                placeholder="cyngn"
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
                placeholder="0126"
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller Domain * (e.g., cyngn.com, techflow.io)
              </label>
              <input
                type="text"
                value={sellerDomain}
                onChange={(e) => setSellerDomain(e.target.value.toLowerCase())}
                placeholder="cyngn.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL will be: <span className="font-mono">{sellerDomain || 'seller-domain.com'}/p/{buyerId || 'buyer-id'}-{sellerId || 'seller-id'}-{mmyy || 'MMYY'}</span>
              </p>
            </div>
          </div>
          
          {sellerDomain && buyerId && sellerId && mmyy && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900">
                🔗 Public URL:
              </div>
              <div className="text-sm text-blue-700 font-mono space-y-1 mt-1">
                <div>https://{sellerDomain}/p/{buyerId}-{sellerId}-{mmyy}</div>
              </div>
            </div>
          )}
        </div>

        {/* Contact Selection for Token Generation */}
        <div className="mb-6 border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            👥 Contact Selection (Optional)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Select contacts to generate personalized tracking links. Tokens enable person identification in analytics.
          </p>
          <ContactMultiSelect
            selectedContacts={selectedContacts}
            onSelectionChange={setSelectedContacts}
            campaignId={campaignId}
            disabled={!campaignId}
          />
          {!campaignId && (
            <p className="mt-2 text-xs text-amber-600">
              ⚠️ Select a campaign first to enable contact selection
            </p>
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

            <button
              onClick={handlePublish}
              disabled={publishing || !validationResult?.isValid || !sellerDomain || !buyerId}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm flex items-center justify-center gap-2"
            >
              {publishing ? (
                <>⏳ Publishing...</>
              ) : (
                <>🚀 Publish to Live</>
              )}
            </button>

            {/* Publish Result */}
            {publishResult && (
              <div id="publish-result" className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  📡 Publish Result
                </h3>

                {publishResult.ok ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg font-semibold bg-green-100 border border-green-300 text-green-800">
                      {publishResult.changed ? '✅ Published Successfully!' : '✅ Already Published (No Changes)'}
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xs font-medium text-blue-900 mb-2">
                        🔗 Live URL:
                      </div>
                      <a
                        href={publishResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline font-medium break-all"
                      >
                        {publishResult.url}
                      </a>
                    </div>

                    {publishResult.contentSha && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs font-medium text-gray-700 mb-1">
                          🔐 Content SHA-256:
                        </div>
                        <code className="text-xs text-gray-600 font-mono break-all">
                          {publishResult.contentSha}
                        </code>
                      </div>
                    )}

                    {!publishResult.changed && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-sm text-yellow-800">
                          ℹ️ The content is identical to the currently published version. No update was made.
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg font-semibold bg-red-100 border border-red-300 text-red-800">
                      ❌ Publish Failed
                    </div>

                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-sm text-gray-800">
                        {publishResult.error}
                      </div>
                    </div>

                    {publishResult.validationErrors && publishResult.validationErrors.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-semibold text-red-700 text-sm">
                          Validation Errors:
                        </div>
                        {publishResult.validationErrors.map((error, idx) => (
                          <div key={idx} className="p-2 bg-red-50 rounded border border-red-200">
                            <div className="text-xs text-gray-600">
                              📍 {error.path}
                            </div>
                            <div className="text-sm text-gray-800 mt-1">
                              {error.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Token Generation Result */}
            {tokenResult && tokenResult.success && (
              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  🔗 Generated Tracking Links
                </h3>
                
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-3">
                  <div className="text-sm text-green-800">
                    ✅ Generated {tokenResult.summary.new} new token{tokenResult.summary.new !== 1 ? 's' : ''}
                    {tokenResult.summary.existing > 0 && (
                      <span className="text-green-600">
                        {' '}({tokenResult.summary.existing} existing reused)
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-auto">
                  {tokenResult.tokens.map((token) => (
                    <div key={token.token} className="p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {token.contact.full_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {token.contact.email}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(token.tracking_url);
                            alert('Copied to clipboard!');
                          }}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Copy Link
                        </button>
                      </div>
                      <div className="mt-1 text-xs text-gray-400 font-mono truncate" title={token.tracking_url}>
                        {token.tracking_url}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

export default function StudioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Studio...</p>
        </div>
      </div>
    }>
      <StudioContent />
    </Suspense>
  );
}

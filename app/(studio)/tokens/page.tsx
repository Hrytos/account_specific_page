'use client';

/**
 * Tokens Viewer Page
 * 
 * View all generated tracking tokens with their URLs
 * Filter by campaign or landing page
 */

import { useState, useEffect } from 'react';

interface Token {
  id: string;
  token: string;
  tracking_url: string | null;
  click_count: number;
  first_clicked_at: string | null;
  last_clicked_at: string | null;
  expires_at: string;
  created_at: string;
  contact: {
    id: string;
    email: string;
    full_name: string;
    company_name: string;
    job_title: string | null;
  } | null;
  campaign: {
    id: string;
    name: string;
  } | null;
  landing_page: {
    id: string;
    page_url_key: string;
  } | null;
}

interface Campaign {
  id: string;
  name: string;
}

interface LandingPage {
  id: string;
  page_url_key: string;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedLandingPage, setSelectedLandingPage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load campaigns and landing pages on mount
  useEffect(() => {
    async function loadFilters() {
      const [campaignsRes, landingPagesRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/landing-pages'),
      ]);
      
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data);
      }
      
      if (landingPagesRes.ok) {
        const data = await landingPagesRes.json();
        setLandingPages(data.landing_pages || []);
      }
    }
    loadFilters();
  }, []);

  // Load tokens when filters change
  useEffect(() => {
    async function loadTokens() {
      setLoading(true);
      
      try {
        const params = new URLSearchParams();
        if (selectedCampaign) params.append('campaign_id', selectedCampaign);
        if (selectedLandingPage) params.append('landing_page_id', selectedLandingPage);

        const response = await fetch(`/api/tokens?${params}`);
        
        if (response.ok) {
          const data = await response.json();
          setTokens(data.tokens || []);
        }
      } catch (error) {
        console.error('Failed to load tokens:', error);
      } finally {
        setLoading(false);
      }
    }
    loadTokens();
  }, [selectedCampaign, selectedLandingPage]);

  const copyToClipboard = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllUrls = async () => {
    const urls = tokens
      .filter(t => t.tracking_url)
      .map(t => `${t.contact?.full_name || 'Unknown'}\t${t.contact?.email || ''}\t${t.tracking_url}`)
      .join('\n');
    await navigator.clipboard.writeText(urls);
    alert('All URLs copied to clipboard (tab-separated: Name, Email, URL)');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔗 Tracking Links
          </h1>
          <p className="text-gray-600">
            View and copy personalized tracking URLs for your contacts
          </p>
        </header>

        {/* Filters */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign
              </label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              >
                <option value="">All Campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landing Page
              </label>
              <select
                value={selectedLandingPage}
                onChange={(e) => setSelectedLandingPage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              >
                <option value="">All Landing Pages</option>
                {landingPages.map((lp) => (
                  <option key={lp.id} value={lp.id}>{lp.page_url_key}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={copyAllUrls}
                disabled={tokens.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                📋 Copy All URLs
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 text-sm text-gray-600">
          {loading ? 'Loading...' : `${tokens.length} tracking link${tokens.length !== 1 ? 's' : ''} found`}
        </div>

        {/* Tokens Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Landing Page</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking URL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tokens.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No tracking links found. Generate some in the Studio!
                    </td>
                  </tr>
                )}
                {tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {token.contact?.full_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {token.contact?.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {token.contact?.company_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[200px] truncate" title={token.campaign?.name}>
                        {token.campaign?.name || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {token.landing_page?.page_url_key || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600 font-mono max-w-[250px] truncate" title={token.tracking_url || ''}>
                        {token.tracking_url || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {token.click_count > 0 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            {token.click_count} click{token.click_count !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {token.tracking_url && (
                        <button
                          onClick={() => copyToClipboard(token.tracking_url!, token.id)}
                          className={`text-xs px-2 py-1 rounded ${
                            copiedId === token.id
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {copiedId === token.id ? '✓ Copied' : 'Copy'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

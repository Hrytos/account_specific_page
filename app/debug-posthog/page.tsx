'use client';

/**
 * PostHog Debug & Authorization Interface
 * 
 * Interactive page for testing and managing PostHog domain authorization.
 * Provides real-time diagnostics and manual authorization tools.
 */

import { useState, useEffect } from 'react';

interface AuthorizedUrlsResponse {
  success: boolean;
  data?: {
    authorizedUrls: string[];
    count: number;
  };
  config?: {
    hasApiKey: boolean;
    posthogHost: string;
    siteUrl: string;
  };
  error?: string;
  message?: string;
}

interface ActionResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export default function DebugPostHogPage() {
  const [authorizedUrls, setAuthorizedUrls] = useState<string[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [testUrl, setTestUrl] = useState('http://localhost:3000/p/test-page');
  const [testSlug, setTestSlug] = useState('aident-cyngn-1125-v4');
  const [bulkInfo, setBulkInfo] = useState<any>(null);
  const [testFilters, setTestFilters] = useState<any>(null);
  const [logs, setLogs] = useState<Array<{ time: string; type: 'info' | 'success' | 'error'; message: string }>>([]);

  const addLog = (type: 'info' | 'success' | 'error', message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, type, message }, ...prev].slice(0, 50));
  };

  const fetchBulkInfo = async () => {
    try {
      const response = await fetch('/api/analytics/bulk-authorize');
      const data = await response.json();
      if (data.success && data.data) {
        setBulkInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching bulk info:', error);
    }
  };

  const fetchTestFilters = async () => {
    try {
      const response = await fetch('/api/analytics/disable-test-filters');
      const data = await response.json();
      if (data.success && data.data) {
        setTestFilters(data.data);
      }
    } catch (error) {
      console.error('Error fetching test filters:', error);
    }
  };

  const disableTestFilters = async () => {
    setActionLoading(true);
    addLog('info', 'Disabling test account filters...');
    
    try {
      const response = await fetch('/api/analytics/disable-test-filters', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        addLog('success', data.message || 'Test filters disabled successfully');
        await fetchTestFilters();
      } else {
        addLog('error', `Failed to disable filters: ${data.error || data.message}`);
      }
    } catch (error) {
      addLog('error', `Error: ${error}`);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchAuthorizedUrls = async () => {
    setLoading(true);
    addLog('info', 'Fetching authorized URLs from PostHog...');
    
    try {
      const response = await fetch('/api/analytics/authorize');
      const data: AuthorizedUrlsResponse = await response.json();
      
      if (data.success && data.data) {
        setAuthorizedUrls(data.data.authorizedUrls);
        setConfig(data.config);
        addLog('success', `Retrieved ${data.data.count} authorized URLs`);
      } else {
        addLog('error', `Failed: ${data.error || data.message}`);
        setConfig(data.config || null);
      }
    } catch (error) {
      addLog('error', `Error fetching URLs: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorizedUrls();
    fetchBulkInfo();
    fetchTestFilters();
  }, []);

  const handleAction = async (action: string, payload: any = {}) => {
    setActionLoading(true);
    addLog('info', `Executing action: ${action}`);
    
    try {
      const response = await fetch('/api/analytics/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      
      const data: ActionResponse = await response.json();
      
      if (data.success) {
        addLog('success', data.message || 'Action completed successfully');
        if (data.data) {
          console.log('Action result:', data.data);
        }
        // Refresh the list
        await fetchAuthorizedUrls();
      } else {
        addLog('error', `Action failed: ${data.error || data.message}`);
      }
    } catch (error) {
      addLog('error', `Error: ${error}`);
    } finally {
      setActionLoading(false);
    }
  };

  const testUrlAuthorization = async () => {
    await handleAction('test_authorization', { url: testUrl });
  };

  const authorizeUrl = async () => {
    await handleAction('authorize_url', { url: testUrl });
  };

  const authorizeEnvironment = async () => {
    await handleAction('authorize_environment');
  };

  const authorizeLanding = async () => {
    await handleAction('authorize_landing', { slug: testSlug });
  };

  const authorizeAllPatterns = async () => {
    const baseUrl = config?.siteUrl || 'http://localhost:3000';
    const patterns = [
      baseUrl,
      `${baseUrl}/`,
      `${baseUrl}/p/*`,
      `${baseUrl}/*`,
    ];
    
    await handleAction('authorize_urls', { urls: patterns });
  };

  const bulkAuthorizeAll = async () => {
    setActionLoading(true);
    addLog('info', 'Starting bulk authorization of all published pages...');
    
    try {
      const response = await fetch('/api/analytics/bulk-authorize', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        addLog('success', data.message || 'Bulk authorization completed');
        if (data.data) {
          addLog('info', `Authorized: ${data.data.authorized}, Failed: ${data.data.failed}`);
        }
        await fetchAuthorizedUrls();
        await fetchBulkInfo();
      } else {
        addLog('error', `Bulk authorization failed: ${data.error || data.message}`);
      }
    } catch (error) {
      addLog('error', `Error: ${error}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">PostHog Debug & Authorization</h1>
        <p className="text-gray-600 mb-8">
          Test and manage PostHog Web Analytics domain authorization
        </p>

        {/* Configuration Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          {config && (
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="font-medium w-48">API Key Configured:</span>
                <span className={config.hasApiKey ? 'text-green-600' : 'text-red-600'}>
                  {config.hasApiKey ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-48">PostHog Host:</span>
                <span className="text-gray-700">{config.posthogHost}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-48">Site URL:</span>
                <span className="text-gray-700">{config.siteUrl}</span>
              </div>
            </div>
          )}
        </div>

        {/* Test Account Filters Warning */}
        {testFilters && testFilters.filters_active && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2 text-red-800">⚠️ Test Account Filters Active!</h2>
            <p className="text-red-700 mb-4">
              PostHog is filtering out localhost events. This is why you don't see events in Live Events.
            </p>
            <p className="text-sm text-red-600 mb-4">
              <strong>Current Filter:</strong> Blocking all events from localhost/127.0.0.1
            </p>
            <button
              onClick={disableTestFilters}
              disabled={actionLoading}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              🔥 Disable Test Filters (Allow Localhost Events)
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={authorizeEnvironment}
              disabled={actionLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Authorize Current Environment
            </button>
            <button
              onClick={authorizeAllPatterns}
              disabled={actionLoading}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Try All Wildcard Patterns
            </button>
            <button
              onClick={fetchAuthorizedUrls}
              disabled={loading}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Refresh Authorized URLs
            </button>
            <button
              onClick={bulkAuthorizeAll}
              disabled={actionLoading}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Bulk Authorize All Pages
            </button>
          </div>
          {bulkInfo && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Bulk Authorization Preview:</strong> {bulkInfo.publishedPages} published pages
                → {bulkInfo.totalUrlsToAuthorize} URLs to authorize (including base URLs and wildcards)
              </p>
            </div>
          )}
        </div>

        {/* Test URL Authorization */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test URL Authorization</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test URL</label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="http://localhost:3000/p/test-page"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={testUrlAuthorization}
                disabled={actionLoading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Test If Authorized
              </button>
              <button
                onClick={authorizeUrl}
                disabled={actionLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Authorize This URL
              </button>
            </div>
          </div>
        </div>

        {/* Authorize Landing Page */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authorize Landing Page</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Landing Page Slug</label>
              <input
                type="text"
                value={testSlug}
                onChange={(e) => setTestSlug(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="aident-cyngn-1125-v4"
              />
              <p className="text-sm text-gray-500 mt-1">
                Will authorize: {config?.siteUrl}/p/{testSlug}
              </p>
            </div>
            <button
              onClick={authorizeLanding}
              disabled={actionLoading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Authorize Landing Page
            </button>
          </div>
        </div>

        {/* Currently Authorized URLs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Currently Authorized URLs ({authorizedUrls.length})
          </h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : authorizedUrls.length === 0 ? (
            <p className="text-gray-500">No authorized URLs found (or API not accessible)</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {authorizedUrls.map((url, index) => (
                <div key={index} className="px-4 py-2 bg-gray-50 rounded border border-gray-200">
                  <code className="text-sm">{url}</code>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No activity yet</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`px-4 py-2 rounded border ${
                  log.type === 'success' ? 'bg-green-50 border-green-200' :
                  log.type === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <span className="text-xs text-gray-500 mr-2">{log.time}</span>
                  <span className={`text-sm ${
                    log.type === 'success' ? 'text-green-700' :
                    log.type === 'error' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-yellow-800 mb-2">🔍 Debugging Steps</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
            <li>Check if API Key is configured above</li>
            <li>Click "Refresh Authorized URLs" to see current state</li>
            <li>Try "Authorize Current Environment" to add base URLs</li>
            <li>Try "Try All Wildcard Patterns" to test if PostHog supports wildcards</li>
            <li>Use "Authorize Landing Page" to manually authorize specific pages</li>
            <li>Watch the Activity Log for API responses and errors</li>
            <li>Check browser console for detailed error messages</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

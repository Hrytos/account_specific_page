/**
 * PostHog Domain Authorization Automation
 * 
 * Automatically manages PostHog Web Analytics authorized URLs
 * to prevent manual configuration scaling issues.
 * 
 * NOTE: This uses PostHog's Web Analytics API which may require specific permissions
 * or might not be publicly available. We provide fallback approaches.
 */

import { PostHog } from 'posthog-node';

interface DomainAuthorizationConfig {
  posthogApiKey: string;
  posthogHost: string;
  projectId?: string;
}

/**
 * PostHog Domain Authorization Manager
 * 
 * IMPORTANT: PostHog's Web Analytics authorized URLs feature may not have 
 * a public API endpoint. This implementation provides the structure for
 * when/if the API becomes available, plus fallback strategies.
 */
export class PostHogDomainManager {
  private posthog: PostHog;
  private config: DomainAuthorizationConfig;

  constructor(config: DomainAuthorizationConfig) {
    this.config = config;
    this.posthog = new PostHog(config.posthogApiKey, {
      host: config.posthogHost,
    });
  }

  /**
   * Get current authorized URLs from PostHog
   * 
   * NOTE: This endpoint may not exist in PostHog's public API.
   * The Web Analytics authorized URLs might only be manageable via dashboard.
   */
  async getCurrentAuthorizedUrls(): Promise<string[]> {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        console.log('[PostHogDomainManager] Attempting to get PostHog authorized URLs...');
      }
      
      // Try multiple possible API endpoints
      const endpoints = [
        // PostHog Cloud API v1
        `/api/projects/@current/`,
        `/api/projects/@current`,
        
        // Try with specific project ID if available
        ...(this.config.projectId ? [`/api/projects/${this.config.projectId}/`] : []),
        
        // List all projects
        `/api/projects/`,
        `/api/projects`,
        
        // Environment endpoints
        `/api/environments/@current/`,
        `/api/environments/@current`,
        
        // Web Analytics specific endpoints (guessing)
        `/api/web-analytics/`,
        `/api/web-analytics/settings/`,
        `/api/projects/@current/web-analytics/`,
        
        // Settings endpoints
        `/api/projects/@current/settings/`,
      ];

      for (const endpoint of endpoints) {
        try {
          const fullUrl = `${this.config.posthogHost}${endpoint}`;
          
          const response = await fetch(fullUrl, {
            headers: {
              'Authorization': `Bearer ${this.config.posthogApiKey}`,
              'Content-Type': 'application/json',
            },
          });

          console.log(`[PostHogDomainManager] Endpoint ${endpoint} response:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });

          if (response.ok) {
            const data = await response.json();
            
            // Log the structure for debugging
            console.log('[PostHogDomainManager] API response structure:', {
              endpoint,
              hasAuthorizedUrls: !!data.authorized_urls,
              hasAppUrls: !!data.app_urls,
              hasWebAnalytics: !!data.web_analytics,
              hasResults: !!data.results,
              topLevelKeys: Object.keys(data).slice(0, 20),
              dataPreview: JSON.stringify(data).substring(0, 500)
            });
            
            // Check for app_urls (Web Analytics authorized URLs)
            if (data.app_urls && Array.isArray(data.app_urls)) {
              console.log('[PostHogDomainManager] ✓ Found app_urls (Web Analytics authorized URLs):', data.app_urls);
              return data.app_urls;
            }
            
            // Check for authorized_urls at top level
            if (data.authorized_urls) {
              console.log('[PostHogDomainManager] ✓ Found authorized_urls:', data.authorized_urls);
              return data.authorized_urls;
            }
            
            // Check in web_analytics object
            if (data.web_analytics && data.web_analytics.authorized_urls) {
              console.log('[PostHogDomainManager] ✓ Found in web_analytics:', data.web_analytics.authorized_urls);
              return data.web_analytics.authorized_urls;
            }
            
            // Check in web_analytics for app_urls
            if (data.web_analytics && data.web_analytics.app_urls) {
              console.log('[PostHogDomainManager] ✓ Found in web_analytics.app_urls:', data.web_analytics.app_urls);
              return data.web_analytics.app_urls;
            }
            
            // If it's an array of projects, try the first one
            if (Array.isArray(data.results) && data.results.length > 0) {
              const project = data.results[0];
              console.log('[PostHogDomainManager] Checking first project in results:', Object.keys(project).slice(0, 20));
              
              // Check for app_urls first (Web Analytics)
              if (project.app_urls && Array.isArray(project.app_urls)) {
                console.log('[PostHogDomainManager] ✓ Found in project.app_urls:', project.app_urls);
                return project.app_urls;
              }
              
              if (project.authorized_urls) {
                console.log('[PostHogDomainManager] ✓ Found in project.authorized_urls:', project.authorized_urls);
                return project.authorized_urls;
              }
              
              if (project.web_analytics && project.web_analytics.authorized_urls) {
                console.log('[PostHogDomainManager] ✓ Found in project.web_analytics:', project.web_analytics.authorized_urls);
                return project.web_analytics.authorized_urls;
              }
              
              if (project.web_analytics && project.web_analytics.app_urls) {
                console.log('[PostHogDomainManager] ✓ Found in project.web_analytics.app_urls:', project.web_analytics.app_urls);
                return project.web_analytics.app_urls;
              }
            }
            
            // If we got a successful response, log it fully for debugging
            console.log('[PostHogDomainManager] ℹ No authorized_urls found in response, full data:', JSON.stringify(data, null, 2));
          } else {
            // Log error details
            const errorText = await response.text().catch(() => 'Unable to read error');
            console.log(`[PostHogDomainManager] Endpoint ${endpoint} error:`, {
              status: response.status,
              statusText: response.statusText,
              body: errorText.substring(0, 200)
            });
          }
        } catch (endpointError) {
          console.log(`[PostHogDomainManager] Endpoint ${endpoint} exception:`, endpointError);
          continue;
        }
      }

      console.warn('[PostHogDomainManager] ⚠ No PostHog API endpoint found for authorized URLs');
      console.warn('[PostHogDomainManager] This may mean:');
      console.warn('[PostHogDomainManager]   1. The API endpoint is not publicly available');
      console.warn('[PostHogDomainManager]   2. The feature requires different API authentication');
      console.warn('[PostHogDomainManager]   3. Authorized URLs are only manageable via dashboard UI');
      return [];
      
    } catch (error) {
      console.error('[PostHogDomainManager] Failed to get authorized URLs:', error);
      return [];
    }
  }

  /**
   * Add a URL to PostHog authorized URLs if not already present
   */
  async authorizeUrl(url: string): Promise<boolean> {
    try {
      const normalizedUrl = this.normalizeUrl(url);
      console.log(`[PostHogDomainManager] Authorizing URL: ${normalizedUrl}`);
      
      const currentUrls = await this.getCurrentAuthorizedUrls();
      console.log(`[PostHogDomainManager] Current authorized URLs count: ${currentUrls.length}`);

      // Check if URL is already authorized
      if (currentUrls.includes(normalizedUrl)) {
        console.log(`[PostHogDomainManager] ✓ URL already authorized: ${normalizedUrl}`);
        return true;
      }

      // Add URL to authorized list
      const updatedUrls = [...currentUrls, normalizedUrl];
      console.log(`[PostHogDomainManager] Adding URL to list (new count: ${updatedUrls.length})`);

      // Try multiple possible endpoints for updating
      const updateEndpoints = [
        `/api/projects/@current/`,
        `/api/projects/@current`,
        ...(this.config.projectId ? [`/api/projects/${this.config.projectId}/`] : []),
        `/api/projects/@current/web-analytics/`,
      ];

      for (const endpoint of updateEndpoints) {
        try {
          const fullUrl = `${this.config.posthogHost}${endpoint}`;
          console.log(`[PostHogDomainManager] Trying to update via: ${fullUrl}`);
          
          const response = await fetch(fullUrl, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${this.config.posthogApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              app_urls: updatedUrls, // Web Analytics uses app_urls
              authorized_urls: updatedUrls, // Legacy fallback
              web_analytics: {
                authorized_urls: updatedUrls,
                app_urls: updatedUrls,
              }
            }),
          });

          console.log(`[PostHogDomainManager] Update response:`, {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });

          if (response.ok) {
            console.log(`[PostHogDomainManager] ✓ Successfully authorized URL: ${normalizedUrl}`);
            return true;
          } else {
            const errorText = await response.text().catch(() => 'Unable to read error');
            console.log(`[PostHogDomainManager] Update failed:`, {
              endpoint,
              status: response.status,
              error: errorText.substring(0, 200)
            });
          }
        } catch (endpointError) {
          console.log(`[PostHogDomainManager] Update endpoint ${endpoint} exception:`, endpointError);
          continue;
        }
      }

      throw new Error('All update endpoints failed - URL authorization not supported via API');
    } catch (error) {
      console.error(`[PostHogDomainManager] ✗ Failed to authorize URL ${url}:`, error);
      return false;
    }
  }

  /**
   * Authorize multiple URLs at once
   */
  async authorizeUrls(urls: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };

    for (const url of urls) {
      const success = await this.authorizeUrl(url);
      if (success) {
        results.success.push(url);
      } else {
        results.failed.push(url);
      }
    }

    return results;
  }

  /**
   * Authorize landing page URL when published
   */
  async authorizeLandingPage(slug: string, baseUrl: string): Promise<boolean> {
    const landingUrl = `${baseUrl}/p/${slug}`;
    return await this.authorizeUrl(landingUrl);
  }

  /**
   * Get optimized URLs to authorize for current environment
   */
  getUrlsToAuthorize(baseUrl: string, includeWildcards = false): string[] {
    const normalizedBase = this.normalizeUrl(baseUrl);
    const urls = [normalizedBase];

    if (includeWildcards) {
      // Try wildcard patterns if PostHog supports them
      urls.push(`${normalizedBase}/*`);
      urls.push(`${normalizedBase}/p/*`);
    }

    return urls;
  }

  /**
   * Test domain authorization by checking if a specific URL is authorized
   */
  async testUrlAuthorization(url: string): Promise<boolean> {
    const currentUrls = await this.getCurrentAuthorizedUrls();
    const normalizedUrl = this.normalizeUrl(url);
    
    return currentUrls.some(authorizedUrl => {
      // Exact match
      if (authorizedUrl === normalizedUrl) return true;
      
      // Wildcard match (if PostHog supports wildcards)
      if (authorizedUrl.endsWith('/*')) {
        const baseUrl = authorizedUrl.slice(0, -2);
        return normalizedUrl.startsWith(baseUrl);
      }
      
      return false;
    });
  }

  /**
   * Normalize URL for consistent comparison
   */
  private normalizeUrl(url: string): string {
    // Remove trailing slashes and normalize protocol
    let normalized = url.trim();
    
    // Ensure protocol
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    
    // Remove trailing slash
    if (normalized.endsWith('/') && normalized.length > 1) {
      normalized = normalized.slice(0, -1);
    }
    
    return normalized;
  }

  /**
   * Clean up unused authorized URLs (maintenance function)
   */
  async cleanupUnusedUrls(keepUrls: string[]): Promise<void> {
    try {
      const currentUrls = await this.getCurrentAuthorizedUrls();
      const normalizedKeepUrls = keepUrls.map(url => this.normalizeUrl(url));
      
      // Filter to only keep specified URLs
      const filteredUrls = currentUrls.filter(url => 
        normalizedKeepUrls.includes(this.normalizeUrl(url))
      );

      if (filteredUrls.length !== currentUrls.length) {
        const response = await fetch(`${this.config.posthogHost}/api/projects/@current/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.posthogApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authorized_urls: filteredUrls,
          }),
        });

        if (response.ok) {
          console.log(`Cleaned up ${currentUrls.length - filteredUrls.length} unused URLs`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup URLs:', error);
    }
  }
}

/**
 * Get PostHog domain manager instance
 */
export function getPostHogDomainManager(): PostHogDomainManager | null {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com';

  if (!apiKey) {
    console.warn('POSTHOG_PERSONAL_API_KEY not found - domain authorization disabled');
    return null;
  }

  return new PostHogDomainManager({
    posthogApiKey: apiKey,
    posthogHost: host,
  });
}

/**
 * Convenience function to authorize current environment
 */
export async function authorizeCurrentEnvironment(): Promise<boolean> {
  const manager = getPostHogDomainManager();
  if (!manager) return false;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const urls = manager.getUrlsToAuthorize(baseUrl, true);

  const results = await manager.authorizeUrls(urls);
  
  console.log('Domain authorization results:', results);
  return results.failed.length === 0;
}

/**
 * Authorize a specific landing page (called during publish)
 */
export async function authorizeLandingPageUrl(slug: string): Promise<boolean> {
  const manager = getPostHogDomainManager();
  if (!manager) {
    console.warn('Domain manager not available - skipping authorization');
    return false;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return await manager.authorizeLandingPage(slug, baseUrl);
}
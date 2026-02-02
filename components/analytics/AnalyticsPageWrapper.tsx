'use client';

/**
 * Analytics Page Wrapper
 * 
 * Client component that handles page-level analytics setup including:
 * - Tenant context registration
 * - Automatic behavioral tracking
 * - Person identification from email campaign tokens
 * 
 * When user arrives via email link (/r/[token]), the redirect adds:
 * - r: tracking token
 * - vid: visitor_id
 * - sid: session_id
 * 
 * This component reads those params and identifies the person in PostHog.
 */

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePostHogSafe } from './AnalyticsProvider';
import { useVisitLeave, useScrollDepth, useIdle } from '../../lib/analytics/hooks';
import type { PageProps } from '../../lib/analytics/context';
import { buildTenantContext } from '../../lib/analytics/context';

interface AnalyticsPageWrapperProps {
  children: React.ReactNode;
  pageProps: PageProps;
  className?: string;
}

/**
 * Contact data returned from /api/token-contact
 */
interface TokenContactData {
  token: string;
  tracking_url: string;
  contact: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string;
    company_name: string;
    job_title: string | null;
    linkedin_url: string | null;
  };
  campaign: {
    id: string;
    name: string;
    smartlead_campaign_id: number | null;
  };
  landing_page: {
    id: string;
    slug: string;
    buyer_id: string | null;
    seller_id: string | null;
  };
}

export function AnalyticsPageWrapper({ children, pageProps, className }: AnalyticsPageWrapperProps) {
  const { registerContext, isInitialized, isTracking, posthog } = usePostHogSafe();
  const searchParams = useSearchParams();
  const [identified, setIdentified] = useState(false);
  const identifyAttempted = useRef(false);

  // Page-level tracking hooks (automatically start when component mounts)
  useVisitLeave();
  useScrollDepth();
  useIdle(30000); // 30 second idle timeout

  // Extract tracking params from URL (set by /r/[token] redirect)
  const token = searchParams.get('r');
  const visitorId = searchParams.get('vid');
  const sessionId = searchParams.get('sid');

  // Person identification from email campaign token
  useEffect(() => {
    // Skip if already attempted, no token, or PostHog not ready
    if (identifyAttempted.current || !token || !isInitialized || !posthog) return;
    identifyAttempted.current = true;

    async function identifyPerson() {
      try {
        console.log('[AnalyticsPageWrapper] Identifying person from token:', token);

        // Fetch contact data from token
        const response = await fetch(`/api/token-contact?token=${encodeURIComponent(token!)}`);
        
        if (!response.ok) {
          console.warn('[AnalyticsPageWrapper] Token lookup failed:', response.status);
          return;
        }

        const data: TokenContactData = await response.json();
        
        if (!data.contact?.email) {
          console.warn('[AnalyticsPageWrapper] No contact email in token data');
          return;
        }

        // Identify person in PostHog with email as distinct_id
        posthog!.identify(data.contact.email, {
          // Core identity
          email: data.contact.email,
          name: data.contact.full_name,
          first_name: data.contact.first_name,
          last_name: data.contact.last_name,
          
          // Company context
          company: data.contact.company_name,
          job_title: data.contact.job_title,
          linkedin_url: data.contact.linkedin_url,
          
          // Campaign attribution
          campaign_id: data.campaign?.id,
          campaign_name: data.campaign?.name,
          smartlead_campaign_id: data.campaign?.smartlead_campaign_id,
          
          // Landing page context
          landing_page_id: data.landing_page?.id,
          landing_page_slug: data.landing_page?.slug,
          buyer_id: data.landing_page?.buyer_id,
          seller_id: data.landing_page?.seller_id,
          
          // Internal tracking
          contact_id: data.contact.id,
          tracking_token: token,
          visitor_id: visitorId,
          session_id: sessionId,
          
          // Attribution
          $initial_referring_domain: 'email',
          attribution_source: 'email_campaign',
          attribution_confidence: 1.0,
        });

        // Set group for company-level analytics
        if (data.contact.company_name) {
          posthog!.group('company', data.contact.company_name, {
            name: data.contact.company_name,
          });
        }

        // Set group for campaign analytics
        if (data.campaign?.id) {
          posthog!.group('campaign', data.campaign.id, {
            name: data.campaign.name,
            smartlead_id: data.campaign.smartlead_campaign_id,
          });
        }

        // Capture identification event
        posthog!.capture('person_identified', {
          identification_method: 'email_token',
          contact_email: data.contact.email,
          contact_name: data.contact.full_name,
          company_name: data.contact.company_name,
          campaign_name: data.campaign?.name,
        });

        console.log('[AnalyticsPageWrapper] Person identified:', {
          email: data.contact.email,
          name: data.contact.full_name,
          company: data.contact.company_name,
        });

        setIdentified(true);
      } catch (error) {
        console.error('[AnalyticsPageWrapper] Failed to identify person:', error);
      }
    }

    identifyPerson();
  }, [token, visitorId, sessionId, isInitialized, posthog]);

  // Register tenant context when component mounts and PostHog is ready
  useEffect(() => {
    if (isInitialized && isTracking && pageProps) {
      const context = buildTenantContext(pageProps);
      registerContext(context);
      
      console.log('[AnalyticsPageWrapper] Analytics context registered for page:', pageProps.page_url_key);
      console.log('[AnalyticsPageWrapper] Full context:', context);
    } else {
      console.log('[AnalyticsPageWrapper] Waiting for analytics:', {
        isInitialized,
        isTracking,
        hasPageProps: !!pageProps
      });
    }
  }, [isInitialized, isTracking, pageProps, registerContext]);

  // Log identification status for debugging
  useEffect(() => {
    if (token && identified) {
      console.log('[AnalyticsPageWrapper] Person identification complete');
    }
  }, [token, identified]);

  return (
    <div className={className}>
      {children}
    </div>
  );
}
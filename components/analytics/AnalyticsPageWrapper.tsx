'use client';

/**
 * Analytics Page Wrapper
 * 
 * Client component that handles page-level analytics setup including
 * tenant context registration and automatic behavioral tracking.
 */

import { useEffect } from 'react';
import { usePostHogSafe } from './AnalyticsProvider';
import { useVisitLeave, useScrollDepth, useIdle } from '../../lib/analytics/hooks';
import type { PageProps } from '../../lib/analytics/context';
import { buildTenantContext } from '../../lib/analytics/context';

interface AnalyticsPageWrapperProps {
  children: React.ReactNode;
  pageProps: PageProps;
  className?: string;
}

export function AnalyticsPageWrapper({ children, pageProps, className }: AnalyticsPageWrapperProps) {
  const { registerContext, isInitialized, isTracking } = usePostHogSafe();

  // Page-level tracking hooks (automatically start when component mounts)
  useVisitLeave();
  useScrollDepth();
  useIdle(30000); // 30 second idle timeout

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

  return (
    <div className={className}>
      {children}
    </div>
  );
}